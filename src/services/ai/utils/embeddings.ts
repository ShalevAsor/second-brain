/**
 * Embedding Generation & Similarity Utilities
 *
 * Low-level functions for semantic search:
 * - Generate embeddings from text using OpenAI
 * - Calculate cosine similarity between vectors
 * - Batch embedding generation with parallelization
 * - Retry logic for API reliability
 */

import { AI_CONFIG } from "../core";
import { getOpenAIClient } from "../core/openai-client";
import {
  AIServiceError,
  type EmbeddingResult,
  type BatchEmbeddingResult,
} from "../core/types";
import { prepareTextForEmbedding } from "./text-processor";

/**
 * Generate embedding for a single text
 *
 * Converts text into a 1536-dimensional vector using OpenAI's embedding model.
 * Includes retry logic and performance tracking.
 *
 * @param text - Text to embed (will be truncated to 8000 chars)
 * @returns Embedding result with vector and metadata
 * @throws AIServiceError if embedding generation fails after retries
 *
 * @example
 * const result = await generateEmbedding("Python quicksort algorithm");
 * console.log(result.embedding.length); // 1536
 * console.log(result.tokenCount); // ~8
 */
export async function generateEmbedding(
  text: string
): Promise<EmbeddingResult> {
  const startTime = Date.now();

  // Validate input
  if (!text || text.trim().length === 0) {
    throw new AIServiceError("Text cannot be empty for embedding generation");
  }

  // Truncate to max length (8000 chars = ~2000 tokens)
  const truncated = text.slice(0, AI_CONFIG.EMBEDDING_MAX_LENGTH);

  try {
    // Get OpenAI client (reuses your singleton!)
    const client = getOpenAIClient();

    // Generate embedding with retry logic
    const response = await withRetry(
      async () =>
        await client.embeddings.create({
          model: AI_CONFIG.EMBEDDING_MODEL,
          input: truncated,
          encoding_format: "float", // Standard float array
        }),
      3 // Max 3 retries
    );

    // Extract embedding vector
    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new AIServiceError("Empty embedding returned from OpenAI");
    }

    // Validate dimensions
    if (embedding.length !== AI_CONFIG.EMBEDDING_DIMENSIONS) {
      throw new AIServiceError(
        `Invalid embedding dimensions: expected ${AI_CONFIG.EMBEDDING_DIMENSIONS}, got ${embedding.length}`
      );
    }

    const generationTime = Date.now() - startTime;

    return {
      embedding,
      tokenCount: response.usage?.total_tokens,
      generationTime,
    };
  } catch (error) {
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      throw new AIServiceError(
        `Embedding generation failed: ${error.message}`,
        error
      );
    }

    throw new AIServiceError(
      "Unknown error during embedding generation",
      error
    );
  }
}

/**
 * Generate embeddings for multiple texts in parallel
 *
 * More efficient than calling generateEmbedding() in a loop.
 * Processes texts in parallel with configurable batch size.
 *
 * @param texts - Array of texts to embed
 * @param batchSize - Number of texts to process in parallel (default: 10)
 * @returns Batch result with all embeddings and stats
 *
 * @example
 * const texts = notes.map(n => `${n.title}\n\n${n.content}`);
 * const result = await generateBatchEmbeddings(texts);
 * console.log(`Generated ${result.successCount} embeddings`);
 */
export async function generateBatchEmbeddings(
  texts: string[],
  batchSize = 10
): Promise<BatchEmbeddingResult> {
  const startTime = Date.now();

  if (texts.length === 0) {
    return {
      embeddings: [],
      totalTokens: 0,
      totalTime: 0,
      successCount: 0,
      failureCount: 0,
    };
  }

  const embeddings: number[][] = [];
  let totalTokens = 0;
  let successCount = 0;
  let failureCount = 0;

  // Process in batches to avoid rate limits
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Generate embeddings in parallel for this batch
    const results = await Promise.allSettled(
      batch.map((text) => generateEmbedding(text))
    );

    // Collect results
    for (const result of results) {
      if (result.status === "fulfilled") {
        embeddings.push(result.value.embedding);
        totalTokens += result.value.tokenCount || 0;
        successCount++;
      } else {
        // For failed embeddings, push empty array (will be filtered later)
        embeddings.push([]);
        failureCount++;
        console.error("Batch embedding failed:", result.reason);
      }
    }
  }

  const totalTime = Date.now() - startTime;

  return {
    embeddings,
    totalTokens,
    totalTime,
    successCount,
    failureCount,
  };
}

/**
 * Calculate cosine similarity between two vectors
 *
 * Cosine similarity measures the cosine of the angle between two vectors.
 * Returns a value between -1 and 1, where:
 * - 1 = identical vectors (0° angle)
 * - 0 = orthogonal vectors (90° angle)
 * - -1 = opposite vectors (180° angle)
 *
 * For embeddings, values are typically between 0 and 1.
 *
 * @param vecA - First embedding vector (1536 dimensions)
 * @param vecB - Second embedding vector (1536 dimensions)
 * @returns Similarity score (0.0 - 1.0, higher = more similar)
 * @throws Error if vectors have different dimensions
 *
 * @example
 * const sim = cosineSimilarity(embedding1, embedding2);
 * console.log(sim); // 0.85 (85% similar)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  // Validate dimensions match
  if (vecA.length !== vecB.length) {
    throw new Error(
      `Vector dimensions must match: ${vecA.length} vs ${vecB.length}`
    );
  }

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }

  // Calculate magnitudes (square root of sum of squares)
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  // Avoid division by zero
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  // Calculate cosine similarity
  const similarity = dotProduct / (magnitudeA * magnitudeB);

  // Clamp to [0, 1] range (should already be in this range for embeddings)
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Retry a function with exponential backoff
 *
 * Implements retry logic for API calls that may fail due to:
 * - Network issues
 * - Rate limiting
 * - Temporary API errors
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds (doubles each retry)
 * @returns Result of the function
 * @throws Error if all retries fail
 *
 * @internal
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      if (!isRetryable) {
        throw error; // Don't retry non-retryable errors
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);

      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms:`,
        error instanceof Error ? error.message : "Unknown error"
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  throw lastError;
}

/**
 * Check if an error is retryable
 *
 * Some errors should be retried (network issues, rate limits),
 * others should not (invalid API key, bad input).
 *
 * @param error - Error to check
 * @returns True if error is retryable
 *
 * @internal
 */
function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  // Retryable: Network issues, timeouts, rate limits
  const retryablePatterns = [
    "network",
    "timeout",
    "econnreset",
    "rate limit",
    "too many requests",
    "503", // Service unavailable
    "429", // Too many requests
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Prepare note content for embedding
 *
 * Combines title and content, truncates to max length.
 * Wrapper around prepareTextForEmbedding with note-specific logic.
 *
 * @param title - Note title
 * @param content - Note content
 * @returns Prepared text ready for embedding
 *
 * @example
 * const text = prepareNoteForEmbedding(note.title, note.content);
 * const result = await generateEmbedding(text);
 */
export function prepareNoteForEmbedding(
  title: string,
  content: string,
  tags?: string[]
): string {
  return prepareTextForEmbedding(title, content, tags);
}
