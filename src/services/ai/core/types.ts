/**
 * AI Service Type Definitions
 *
 * Centralized types for AI-powered features across the app.
 * Used by Quick Capture, semantic search, and future AI features.
 */

import { AI_CONFIG } from "./config";
export type { TruncationResult } from "../utils/text-processor";
/**
 * AI Analysis Result for Quick Capture
 * Contains AI-generated suggestions for organizing captured content
 */
export interface ContentAnalysisResult {
  title: string; // AI-generated title (max 100 chars)
  folderPath: string | null; // Suggested folder path (e.g., "CS 101/Algorithms")
  tags: string[]; // Suggested tag names (lowercase, no duplicates)
  reasoning: string; // AI's explanation of its choices
  confidence: "high" | "medium" | "low"; // AI's confidence level
  wasTruncated?: boolean; // True if content was truncated due to length
}

/**
 * OpenAI Error Handling
 * Custom error type for AI service failures
 */
export class AIServiceError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "AIServiceError";
  }
}
// ============================================
// SEMANTIC SEARCH TYPES (NEW)
// ============================================
/**
 * Embedding generation result
 * Contains the vector and optional metadata
 */
export interface EmbeddingResult {
  /**
   * The embedding vector (1536 dimensions)
   * Each number represents a semantic feature
   */
  embedding: number[];

  /**
   * Number of tokens used for this embedding
   * Useful for cost tracking and debugging
   */
  tokenCount?: number;

  /**
   * Time taken to generate embedding (milliseconds)
   * Useful for performance monitoring
   */
  generationTime?: number;
}
/**
 * Note with embedding data
 * Extended note type for semantic search operations
 */
export interface NoteWithEmbedding {
  id: string;
  title: string;
  content: string;
  embedding: number[] | null;
  embeddingUpdatedAt: Date | null;
  contentUpdatedAt: Date;
  folderId?: string | null;
  tags?: Array<{ tag: { id: string; name: string } }>;
}
/**
 * Embedding freshness check result
 * Determines if an embedding needs regeneration
 */
export interface EmbeddingFreshnessCheck {
  /**
   * Whether the embedding needs to be regenerated
   */
  needsRegeneration: boolean;

  /**
   * Reason for regeneration (if needed)
   */
  reason?:
    | "no_embedding" // No embedding exists
    | "content_updated" // Content changed after embedding
    | "missing_timestamp" // embeddingUpdatedAt is null
    | "corrupted"; // Embedding is invalid (wrong dimensions, etc.)
}
/**
 * Semantic search result
 * A note with its similarity score to the query
 */
export interface SemanticSearchResult {
  /**
   * The note that matched the search
   */
  note: {
    id: string;
    title: string;
    content: string;
    folderId: string | null;
    tags: Array<{ tag: { id: string; name: string } }>;
    createdAt: Date;
    updatedAt: Date;
  };

  /**
   * Cosine similarity score (0.0 - 1.0)
   * Higher = more similar to search query
   * 0.6+ = reasonably relevant
   * 0.8+ = highly relevant
   * 0.9+ = very similar
   */
  similarity: number;
}
/**
 * Batch embedding generation result
 * For processing multiple texts at once
 */
export interface BatchEmbeddingResult {
  /**
   * Array of embeddings (one per input text)
   */
  embeddings: number[][];

  /**
   * Total tokens used across all embeddings
   */
  totalTokens: number;

  /**
   * Time taken for batch generation (milliseconds)
   */
  totalTime: number;

  /**
   * Number of successful embeddings generated
   */
  successCount: number;

  /**
   * Number of failed embeddings (if any)
   */
  failureCount: number;
}

/**
 * Semantic search statistics
 * Metadata about the search operation
 */
export interface SemanticSearchStats {
  /**
   * Total notes searched
   */
  totalNotes: number;

  /**
   * Notes that needed embedding regeneration
   */
  regeneratedCount: number;

  /**
   * Notes with fresh embeddings
   */
  cachedCount: number;

  /**
   * Total time for search operation (milliseconds)
   */
  totalTime: number;

  /**
   * Time spent generating embeddings (milliseconds)
   */
  embeddingTime: number;

  /**
   * Time spent calculating similarity (milliseconds)
   */
  similarityTime: number;

  /**
   * Total API calls made
   */
  apiCalls: number;

  /**
   * Total tokens used
   */
  tokensUsed: number;
}
/**
 * Complete semantic search response
 * Includes results and metadata
 */
export interface SemanticSearchResponse {
  /**
   * Search results sorted by similarity (descending)
   */
  results: SemanticSearchResult[];

  /**
   * Search statistics and metadata
   */
  stats: SemanticSearchStats;

  /**
   * The query that was searched
   */
  query: string;

  /**
   * Timestamp of the search
   */
  timestamp: Date;
  /**
   * Notes that had embeddings regenerated during search
   * Use this array to save embeddings to database
   */
  updatedNotes: Array<{
    id: string;
    embedding: number[];
    embeddingUpdatedAt: Date;
  }>;
}

/**
 * Semantic search options
 * Configuration for search behavior
 */
export interface SemanticSearchOptions {
  /**
   * Minimum similarity threshold (0.0 - 1.0)
   * Default: 0.6
   */
  minSimilarity?: number;

  /**
   * Maximum number of results to return
   * Default: 20
   */
  maxResults?: number;

  /**
   * Whether to regenerate stale embeddings during search
   * Default: true
   */
  regenerateStale?: boolean;
}

/**
 * Check if embedding needs regeneration
 * Implements lazy evaluation logic
 *
 * @param note - Note with embedding metadata
 * @returns Freshness check result
 */
export function checkEmbeddingFreshness(
  note: NoteWithEmbedding
): EmbeddingFreshnessCheck {
  // Case 1: No embedding exists
  if (!note.embedding || note.embedding.length === 0) {
    return {
      needsRegeneration: true,
      reason: "no_embedding",
    };
  }

  // Case 2: Missing timestamp (shouldn't happen, but handle it)
  if (!note.embeddingUpdatedAt) {
    return {
      needsRegeneration: true,
      reason: "missing_timestamp",
    };
  }

  // Case 3: Content updated after embedding
  if (note.contentUpdatedAt > note.embeddingUpdatedAt) {
    return {
      needsRegeneration: true,
      reason: "content_updated",
    };
  }

  // Case 4: Corrupted embedding (wrong dimensions)
  if (note.embedding.length !== AI_CONFIG.EMBEDDING_DIMENSIONS) {
    return {
      needsRegeneration: true,
      reason: "corrupted",
    };
  }

  // Embedding is fresh!
  return {
    needsRegeneration: false,
  };
}
/**
 * Format similarity score as percentage
 * Useful for displaying to users
 *
 * @param similarity - Cosine similarity (0.0 - 1.0)
 * @returns Formatted percentage string (e.g., "85%")
 */
export function formatSimilarity(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

/**
 * Get similarity level label
 * Human-readable similarity description
 *
 * @param similarity - Cosine similarity (0.0 - 1.0)
 * @returns Descriptive label
 */
export function getSimilarityLevel(similarity: number): string {
  if (similarity >= 0.9) return "Very High";
  if (similarity >= 0.8) return "High";
  if (similarity >= 0.7) return "Good";
  if (similarity >= 0.6) return "Moderate";
  return "Low";
}
// ============================================
// CONTENT FORMATTING TYPES (NEW)
// ============================================

/**
 * Content formatting result
 * Returned when AI formats plain text to HTML
 */
export interface ContentFormattingResult {
  /**
   * The formatted HTML content ready for Tiptap editor
   */
  formattedContent: string;

  /**
   * Whether formatting was actually applied
   * False if content was too long or formatting failed
   */
  wasFormatted: boolean;

  /**
   * Detected content type (optional metadata)
   */
  contentType?: "code" | "recipe" | "article" | "notes" | "mixed" | "tasks";

  /**
   * Detected programming language (only for code content)
   */
  detectedLanguage?: string;

  /**
   * Error message if formatting failed
   */
  error?: string;
}

/**
 * Content formatting options
 */
export interface ContentFormattingOptions {
  /**
   * Maximum content length to format
   * Default: AI_CONFIG.MAX_FORMATTING_LENGTH
   */
  maxLength?: number;

  /**
   * Whether to strip existing HTML before formatting
   * Default: true
   */
  stripHtml?: boolean;
}
