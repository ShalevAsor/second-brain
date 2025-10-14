/**
 * Semantic Search Orchestration
 *
 * High-level semantic search logic implementing lazy evaluation:
 * 1. Check which notes need fresh embeddings
 * 2. Regenerate stale embeddings (in parallel)
 * 3. Generate query embedding
 * 4. Calculate similarities
 * 5. Sort and filter results
 * 6. Return results with performance stats
 */

import {
  generateEmbedding,
  generateBatchEmbeddings,
  cosineSimilarity,
  prepareNoteForEmbedding,
} from "@/services/ai/utils/embeddings";
import {
  AI_CONFIG,
  checkEmbeddingFreshness,
  type NoteWithEmbedding,
  type SemanticSearchResult,
  type SemanticSearchStats,
  type SemanticSearchResponse,
  SemanticSearchOptions,
} from "./core";

/**
 * Perform semantic search on notes with lazy embedding generation
 *
 * This is the main function that orchestrates the entire search process.
 * Implements lazy evaluation: only generates embeddings when needed.
 *
 * **How it works:**
 * 1. Check which notes have stale/missing embeddings
 * 2. Regenerate only the stale embeddings (parallel)
 * 3. Generate embedding for search query
 * 4. Calculate cosine similarity for all notes
 * 5. Filter by threshold and sort by similarity
 * 6. Return top results with performance stats
 *
 * @param query - User's search query (natural language)
 * @param notes - All user's notes (with embedding metadata)
 * @param options - Optional search configuration
 * @returns Search results with similarity scores and stats
 */
export async function performSemanticSearch(
  query: string,
  notes: NoteWithEmbedding[],
  options: SemanticSearchOptions = {}
): Promise<SemanticSearchResponse> {
  const searchStartTime = Date.now();

  // Validate inputs
  if (!query || query.trim().length === 0) {
    throw new Error("Search query cannot be empty");
  }

  if (notes.length === 0) {
    return createEmptyResponse(query, searchStartTime);
  }

  // Apply default options
  const {
    minSimilarity = AI_CONFIG.SIMILARITY_THRESHOLD,
    maxResults = AI_CONFIG.MAX_SEARCH_RESULTS,
    regenerateStale = true,
  } = options;

  // Initialize stats
  let regeneratedCount = 0;
  let cachedCount = 0;
  let embeddingTime = 0;
  let apiCalls = 0;
  let tokensUsed = 0;

  // STEP 1: Identify notes needing fresh embeddings
  const notesToRegenerate: NoteWithEmbedding[] = [];
  const notesWithFreshEmbeddings: NoteWithEmbedding[] = [];

  for (const note of notes) {
    const freshnessCheck = checkEmbeddingFreshness(note);
    console.log(`🔍 [Freshness Check] "${note.title.slice(0, 40)}":`, {
      hasEmbedding: !!(note.embedding && note.embedding.length > 0),
      contentUpdatedAt: note.contentUpdatedAt?.toISOString() || "NULL",
      embeddingUpdatedAt: note.embeddingUpdatedAt?.toISOString() || "NULL",
      needsRegen: freshnessCheck.needsRegeneration,
      reason: freshnessCheck.reason || "fresh",
    });

    if (freshnessCheck.needsRegeneration && regenerateStale) {
      notesToRegenerate.push(note);
    } else if (!freshnessCheck.needsRegeneration) {
      notesWithFreshEmbeddings.push(note);
      cachedCount++;
    }
    // Notes that need regeneration but regenerateStale=false are skipped
  }

  // STEP 2: Regenerate stale embeddings (in parallel)
  const embeddingStartTime = Date.now();

  if (notesToRegenerate.length > 0) {
    // Prepare texts for embedding
    const textsToEmbed = notesToRegenerate.map((note) =>
      prepareNoteForEmbedding(
        note.title,
        note.content,
        note.tags?.map((t) => t.tag.name) || []
      )
    );

    // Generate embeddings in parallel (batch of 10 at a time to avoid rate limits)
    const batchResult = await generateBatchEmbeddings(textsToEmbed, 10);

    // Update notes with new embeddings
    for (let i = 0; i < notesToRegenerate.length; i++) {
      const embedding = batchResult.embeddings[i];
      if (embedding && embedding.length > 0) {
        notesToRegenerate[i].embedding = embedding;
        notesToRegenerate[i].embeddingUpdatedAt = new Date();
        regeneratedCount++;
      }
    }

    // Update stats
    apiCalls += batchResult.successCount;
    tokensUsed += batchResult.totalTokens;
  }

  embeddingTime = Date.now() - embeddingStartTime;

  console.log("🔍 [Query] Search query:", query);
  console.log("🔍 [Query] Preparing query embedding...");

  // STEP 3: Generate query embedding
  const queryEmbeddingResult = await generateEmbedding(query);
  const queryEmbedding = queryEmbeddingResult.embedding;

  apiCalls += 1;
  tokensUsed += queryEmbeddingResult.tokenCount || 0;

  // STEP 4: Calculate similarities for all notes with embeddings
  const similarityStartTime = Date.now();

  // Combine all notes with valid embeddings
  const allNotesWithEmbeddings = [
    ...notesWithFreshEmbeddings,
    ...notesToRegenerate.filter((n) => n.embedding && n.embedding.length > 0),
  ];

  const results: SemanticSearchResult[] = allNotesWithEmbeddings
    .map((note) => {
      // Skip notes without embeddings (shouldn't happen, but safety check)
      if (!note.embedding || note.embedding.length === 0) {
        return null;
      }

      const similarity = cosineSimilarity(queryEmbedding, note.embedding);
      console.log(
        `📊 [Similarity] Note: "${note.title.slice(0, 40)}" → ${(
          similarity * 100
        ).toFixed(1)}%`
      );

      return {
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          folderId: note.folderId || null,
          tags: note.tags || [],
          createdAt: new Date(), // Will be overwritten by actual data in server action
          updatedAt: new Date(), // Will be overwritten by actual data in server action
        },
        similarity,
      };
    })
    .filter((result): result is SemanticSearchResult => result !== null)
    .filter((result) => result.similarity >= minSimilarity) // Filter by threshold
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (highest first)
    .slice(0, maxResults); // Limit results

  const similarityTime = Date.now() - similarityStartTime;
  console.log(
    `📊 [Similarity] Total notes: ${allNotesWithEmbeddings.length}, Above threshold (${minSimilarity}): ${results.length}`
  );

  // STEP 5: Build response with stats
  const totalTime = Date.now() - searchStartTime;

  const stats: SemanticSearchStats = {
    totalNotes: notes.length,
    regeneratedCount,
    cachedCount,
    totalTime,
    embeddingTime,
    similarityTime,
    apiCalls,
    tokensUsed,
  };
  const updatedNotes = notesToRegenerate
    .filter((note) => note.embedding && note.embeddingUpdatedAt)
    .map((note) => ({
      id: note.id,
      embedding: note.embedding!,
      embeddingUpdatedAt: note.embeddingUpdatedAt!,
    }));

  console.log(
    `✨ [Semantic Search] Regenerated ${updatedNotes.length} embeddings`
  );

  return {
    results,
    stats,
    query,
    timestamp: new Date(),
    updatedNotes,
  };
}

/**
 * Check which notes need embedding regeneration
 *
 * Useful for understanding the state before search.
 * Can be used to show user: "X notes need processing"
 *
 * @param notes - Notes to check
 * @returns Object with counts of fresh/stale embeddings
 */
export function analyzeEmbeddingStatus(notes: NoteWithEmbedding[]): {
  total: number;
  fresh: number;
  needsRegeneration: number;
  noEmbedding: number;
  stale: number;
  corrupted: number;
} {
  let fresh = 0;
  let noEmbedding = 0;
  let stale = 0;
  let corrupted = 0;

  for (const note of notes) {
    const check = checkEmbeddingFreshness(note);

    if (!check.needsRegeneration) {
      fresh++;
    } else {
      switch (check.reason) {
        case "no_embedding":
          noEmbedding++;
          break;
        case "content_updated":
          stale++;
          break;
        case "corrupted":
          corrupted++;
          break;
        case "missing_timestamp":
          stale++;
          break;
      }
    }
  }

  return {
    total: notes.length,
    fresh,
    needsRegeneration: noEmbedding + stale + corrupted,
    noEmbedding,
    stale,
    corrupted,
  };
}

/**
 * Create empty search response
 *
 * Returns properly formatted empty response when no notes provided.
 *
 * @param query - Search query
 * @param startTime - When search started
 * @returns Empty response with zero stats
 *
 * @internal
 */
function createEmptyResponse(
  query: string,
  startTime: number
): SemanticSearchResponse {
  return {
    results: [],
    stats: {
      totalNotes: 0,
      regeneratedCount: 0,
      cachedCount: 0,
      totalTime: Date.now() - startTime,
      embeddingTime: 0,
      similarityTime: 0,
      apiCalls: 0,
      tokensUsed: 0,
    },
    query,
    timestamp: new Date(),
    updatedNotes: [],
  };
}
