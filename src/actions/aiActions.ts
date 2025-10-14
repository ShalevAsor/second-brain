"use server";

/**
 * AI-Powered Server Actions
 *
 * Handles AI features like Quick Capture content analysis.
 * All actions run on the server with proper authentication.
 */

import { analyzeContent } from "@/services/ai/content-analyzer";
import {
  AIServiceError,
  ContentFormattingResult,
  NoteWithEmbedding,
  SemanticSearchResponse,
  type ContentAnalysisResult,
} from "@/services/ai/core/types";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSuccessResult, createErrorResult } from "@/lib/actionHelpers";
import type { ActionResult } from "@/types/actionTypes";
import type { FolderOption } from "@/types/folderTypes";
import {
  analyzeEmbeddingStatus,
  performSemanticSearch,
} from "@/services/ai/semantic-search";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import {
  SemanticSearchInput,
  semanticSearchQuerySchema,
} from "@/schemas/searchSchemas";
import { AI_CONFIG } from "@/services/ai/core";
import { formatContentWithAI } from "@/services/ai/content-fornatter";
import { truncateContent } from "@/services/ai/utils";
import { buildFolderPath } from "@/lib/folderHelpers";

/**
 * Analyze content for Quick Capture
 *
 * Takes raw pasted content and returns AI-generated organization suggestions.
 * Includes user's existing folders and tags as context for better suggestions.
 * Automatically truncates very long content with user notification.
 *
 * @param content - Raw text content pasted by user
 * @returns ActionResult with AI suggestions (includes truncation flag if applicable)
 */
export async function analyzeContentForOrganization(
  content: string
): Promise<ActionResult<ContentAnalysisResult>> {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Validate input
    if (!content || content.trim().length === 0) {
      return createErrorResult({
        error: "Content cannot be empty",
      });
    }

    // 3. Handle content length with smart truncation
    const {
      content: processedContent,
      wasTruncated,
      originalLength,
    } = truncateContent(content);
    // ✅ LOG: Content info
    console.log(
      "📝 [AI Analysis] Content length:",
      originalLength,
      "| Truncated:",
      wasTruncated
    );

    // 4. Fetch user's folders for AI context
    const folders = await prisma.folder.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        parentId: true,
        isDefault: true,
        depth: true,
      },
      orderBy: [{ depth: "asc" }, { name: "asc" }],
    });

    const folderOptions: FolderOption[] = folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      isDefault: f.isDefault,
      depth: f.depth,
    }));

    // 5. Fetch user's tags for AI context
    const tags = await prisma.tag.findMany({
      where: { userId },
      select: { name: true },
      orderBy: { name: "asc" },
    });

    const tagNames = tags.map((t) => t.name);

    // ✅ LOG: User context (with full paths)
    console.log("📁 [AI Analysis] User has:", folders.length, "folders");
    if (folderOptions.length > 0) {
      const folderPaths = folderOptions.map((f) =>
        buildFolderPath(f, folderOptions)
      );
      console.log("   Folders:", folderPaths.join(", "));
    } else {
      console.log("   Folders: none");
    }
    console.log("🏷️  [AI Analysis] User has:", tags.length, "tags");
    console.log("   Tags:", tagNames.join(", ") || "none");

    // 6. Call AI analyzer with processed content
    const analysis = await analyzeContent(
      processedContent,
      folderOptions,
      tagNames
    );

    // ✅ LOG: AI response
    console.log("🤖 [AI Analysis] AI Response:");
    console.log("   Title:", analysis.title);
    console.log("   Folder:", analysis.folderPath || "null");
    console.log("   Tags:", analysis.tags.join(", ") || "none");
    console.log("   Confidence:", analysis.confidence);
    console.log("   Reasoning:", analysis.reasoning);

    // 7. Create result with truncation info if applicable
    const result: ContentAnalysisResult = {
      ...analysis,
      ...(wasTruncated && {
        wasTruncated: true,
        reasoning: `${
          analysis.reasoning
        }\n\n⚠️ Note: Content was truncated from ${originalLength.toLocaleString()} to ${AI_CONFIG.MAX_CONTENT_LENGTH.toLocaleString()} characters.`,
      }),
    };

    return createSuccessResult(result);
  } catch (error) {
    console.error(
      "❌ [AI Analysis] Error:",
      error instanceof Error ? error.message : "Unknown"
    );

    if (error instanceof AIServiceError) {
      return createErrorResult({ error: error.message });
    }

    console.error("AI analysis error:", error);
    return createErrorResult({
      error: "Failed to analyze content. Please try again.",
    });
  }
}
/**
 * Perform semantic search on user's notes
 *
 * Main server action for AI search functionality.
 * Implements lazy embedding evaluation:
 * 1. Fetches user's notes with embedding data
 * 2. Performs semantic search (regenerates stale embeddings)
 * 3. Saves new embeddings to database
 * 4. Returns search results
 *
 * @param query - User's search query (natural language)
 * @param options - Optional search configuration
 * @returns Search results with similarity scores and stats
 *
 * @example
 * const result = await semanticSearchNotes("Python sorting algorithms");
 * if (result.success) {
 *   console.log(`Found ${result.data.results.length} notes`);
 *   console.log(`Stats: ${JSON.stringify(result.data.stats)}`);
 * }
 */
/**
 * Perform semantic search on user's notes
 */
export async function semanticSearchNotes(
  input: SemanticSearchInput
): Promise<ActionResult<SemanticSearchResponse>> {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Validate input
    const validated = semanticSearchQuerySchema.parse(input);
    const { query, minSimilarity, maxResults, folderId, tagIds } = validated;

    // 3. Fetch user's notes with embedding data
    const notes = await prisma.note.findMany({
      where: {
        userId,
        // Optional: Filter by folder
        ...(folderId !== undefined && {
          folderId: folderId,
        }),
      },
      select: {
        id: true,
        title: true,
        content: true,
        folderId: true,
        embedding: true,
        embeddingUpdatedAt: true,
        contentUpdatedAt: true,
        createdAt: true,
        updatedAt: true,
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // 4. Check if user has any notes
    if (notes.length === 0) {
      return createSuccessResult(createEmptySearchResponse(validated.query));
    }

    // 5. Optional: Filter by tags (post-fetch for simplicity)
    let filteredNotes = notes;
    if (tagIds && tagIds.length > 0) {
      filteredNotes = notes.filter((note) => {
        const noteTags = note.tags.map((t) => t.tag.id);
        return tagIds!.some((tagId) => noteTags.includes(tagId));
      });

      if (filteredNotes.length === 0) {
        return createSuccessResult(createEmptySearchResponse(validated.query));
      }
    }

    // 6. Transform notes to match NoteWithEmbedding type
    const notesWithEmbedding: NoteWithEmbedding[] = filteredNotes.map(
      (note) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        folderId: note.folderId,
        embedding: note.embedding as number[] | null,
        embeddingUpdatedAt: note.embeddingUpdatedAt,
        contentUpdatedAt: note.contentUpdatedAt,
        tags: note.tags,
      })
    );

    // 7. Perform semantic search (with lazy embedding generation)
    const searchResponse = await performSemanticSearch(
      query,
      notesWithEmbedding,
      {
        minSimilarity: minSimilarity,
        maxResults: maxResults,
        regenerateStale: true,
      }
    );

    console.log("🔍 [Semantic Search] Search complete:", {
      resultsCount: searchResponse.results.length,
      regeneratedCount: searchResponse.stats.regeneratedCount,
      cachedCount: searchResponse.stats.cachedCount,
      totalTime: searchResponse.stats.totalTime,
    });

    // 8. Save regenerated embeddings to database (in background)
    if (searchResponse.updatedNotes.length > 0) {
      console.log(
        `💾 [Semantic Search] Saving ${searchResponse.updatedNotes.length} new embeddings...`
      );

      // Fire-and-forget save (non-blocking)
      Promise.allSettled(
        searchResponse.updatedNotes.map(async (noteData) => {
          try {
            await prisma.note.update({
              where: { id: noteData.id },
              data: {
                embedding: noteData.embedding,
                embeddingUpdatedAt: noteData.embeddingUpdatedAt,
              },
            });
            console.log(
              `✅ [Semantic Search] Saved embedding for note: ${noteData.id}`
            );
          } catch (error) {
            logger.error("Failed to save embedding:", {
              noteId: noteData.id,
              error,
            });
          }
        })
      ).catch((error) => {
        logger.error("Batch embedding save failed:", error);
      });
    } else {
      console.log(
        "✨ [Semantic Search] All embeddings were cached (no saves needed)"
      );
    }

    // 9. Enrich results with full note data
    const enrichedResults = searchResponse.results.map((result) => {
      const fullNote = notes.find((n) => n.id === result.note.id);
      return {
        ...result,
        note: {
          ...result.note,
          createdAt: fullNote?.createdAt || result.note.createdAt,
          updatedAt: fullNote?.updatedAt || result.note.updatedAt,
        },
      };
    });

    const enrichedResponse: SemanticSearchResponse = {
      ...searchResponse,
      results: enrichedResults,
    };

    // 10. Optional: Revalidate cache if embeddings were updated
    if (searchResponse.updatedNotes.length > 0) {
      revalidatePath("/notes");
    }

    logger.info("Semantic search completed", {
      query,
      resultsCount: enrichedResponse.results.length,
      stats: enrichedResponse.stats,
    });

    return createSuccessResult(enrichedResponse);
  } catch (error) {
    logger.error("Semantic search failed:", { input, error });

    // Return user-friendly error
    if (error instanceof Error) {
      return createErrorResult(
        `Search failed: ${error.message}. Please try again.`
      );
    }

    return createErrorResult(
      "An unexpected error occurred during search. Please try again."
    );
  }
}

/**
 * Get embedding status for user's notes
 *
 * Useful for showing user how many notes need processing.
 * Can be called before search to show loading state.
 *
 * @returns Statistics about embedding status
 *
 * @example
 * const result = await getEmbeddingStatus();
 * if (result.success) {
 *   console.log(`${result.data.needsRegeneration} notes need processing`);
 *   // Show: "Analyzing 15 notes..."
 * }
 */
export async function getEmbeddingStatus(): Promise<
  ActionResult<{
    total: number;
    fresh: number;
    needsRegeneration: number;
    noEmbedding: number;
    stale: number;
    corrupted: number;
  }>
> {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Fetch notes with embedding data
    const notes = await prisma.note.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        content: true,
        embedding: true,
        embeddingUpdatedAt: true,
        contentUpdatedAt: true,
      },
    });

    // 3. Analyze embedding status
    const status = analyzeEmbeddingStatus(
      notes.map((note) => ({
        ...note,
        folderId: null,
        tags: [],
        embedding: note.embedding as number[] | null,
      }))
    );

    return createSuccessResult(status);
  } catch (error) {
    logger.error("Failed to get embedding status:", error);
    return createErrorResult("Failed to analyze notes. Please try again.");
  }
}

function createEmptySearchResponse(query: string): SemanticSearchResponse {
  return {
    results: [],
    stats: {
      totalNotes: 0,
      regeneratedCount: 0,
      cachedCount: 0,
      totalTime: 0,
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
/**
 * Format content with AI
 *
 * Takes plain text content and returns formatted HTML for Tiptap editor.
 * Intelligently detects content type and applies appropriate formatting.
 *
 * @param content - Plain text content to format
 * @returns ActionResult with formatted HTML
 */
export async function formatContentAction(
  content: string
): Promise<ActionResult<ContentFormattingResult>> {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Validate input
    if (!content || content.trim().length === 0) {
      return createErrorResult({
        error: "Content cannot be empty",
      });
    }

    // 3. Check length
    if (content.length > AI_CONFIG.MAX_FORMATTING_LENGTH) {
      return createSuccessResult({
        formattedContent: content,
        wasFormatted: false,
        error: `Content too long to format (max ${AI_CONFIG.MAX_FORMATTING_LENGTH.toLocaleString()} characters)`,
      });
    }

    console.log("🎨 [Format Action] User:", userId);
    console.log("   Content length:", content.length);

    // 4. Call formatter
    const result = await formatContentWithAI(content);

    console.log("✅ [Format Action] Success");
    console.log("   Formatted:", result.wasFormatted);

    return createSuccessResult(result);
  } catch (error) {
    console.error("❌ [Format Action] Error:", error);

    if (error instanceof AIServiceError) {
      return createErrorResult({ error: error.message });
    }

    return createErrorResult({
      error: "Failed to format content. Please try again.",
    });
  }
}
