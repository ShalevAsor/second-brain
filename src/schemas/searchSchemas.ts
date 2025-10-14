/**
 * Semantic Search Validation Schemas
 *
 * Zod schemas for validating semantic search inputs.
 * Ensures type-safe and validated data throughout the search flow.
 */

import { z } from "zod";
/**
 * Semantic search query schema
 *
 * Validates the user's search query input.
 * Enforces minimum length and reasonable maximum length.
 */
export const semanticSearchQuerySchema = z.object({
  /**
   * Search query (natural language)
   * Min: 3 characters (too short = not meaningful)
   * Max: 500 characters (too long = probably not a query)
   */
  query: z
    .string()
    .min(3, "Search query must be at least 3 characters")
    .max(500, "Search query is too long (max 500 characters)")
    .trim()
    .refine((val) => val.length > 0, {
      message: "Search query cannot be empty",
    }),
  /**
   * Optional: Minimum similarity threshold (0.0 - 1.0)
   * Default: 0.6 (defined in AI_CONFIG)
   */
  minSimilarity: z
    .number()
    .min(0, "Similarity must be at least 0")
    .max(1, "Similarity cannot exceed 1")
    .optional(),
  /**
   * Optional: Maximum number of results to return
   * Default: 20 (defined in AI_CONFIG)
   */
  maxResults: z
    .number()
    .int("Max results must be an integer")
    .min(1, "Must return at least 1 result")
    .max(100, "Cannot return more than 100 results")
    .optional(),
  /**
   * Optional: Filter by folder ID
   * Use null to search notes without a folder
   * Omit to search all folders
   */
  folderId: z.cuid().nullable().optional(),
  /**
   * Optional: Filter by tag IDs
   * Notes must have at least one of these tags
   */
  tagIds: z.array(z.cuid()).optional(),
});

/**
 * Type inference from schema
 * Use this type in components and actions
 */
export type SemanticSearchInput = z.infer<typeof semanticSearchQuerySchema>;

/**
 * Simplified schema for quick validation (query only)
 * Useful for simple search inputs without filters
 */
export const simpleSearchSchema = z.object({
  query: z
    .string()
    .min(3, "Search query must be at least 3 characters")
    .max(500, "Search query is too long")
    .trim(),
});
/**
 * Type inference for simple search
 */
export type SimpleSearchInput = z.infer<typeof simpleSearchSchema>;
/**
 * Schema for bulk embedding regeneration
 */
export const regenerateEmbeddingsSchema = z.object({
  /**
   * Force regeneration of all embeddings (even fresh ones)
   * Default: false (only regenerate stale)
   */
  forceAll: z.boolean().default(false),
});
/**
 * Type inference for regeneration input
 */
export type RegenerateEmbeddingsInput = z.infer<
  typeof regenerateEmbeddingsSchema
>;

/**
 * Schema for search result filtering (client-side)
 */
export const searchFilterSchema = z.object({
  /**
   * Minimum similarity to display
   */
  minSimilarity: z.number().min(0).max(1).optional(),

  /**
   * Filter by similarity level
   */
  similarityLevel: z
    .enum(["veryHigh", "high", "good", "moderate", "all"])
    .optional(),

  /**
   * Filter by folder
   */
  folderId: z.cuid().nullable().optional(),

  /**
   * Filter by tags (any match)
   */
  tagIds: z.array(z.cuid()).optional(),

  /**
   * Sort order
   */
  sortBy: z.enum(["similarity", "updatedAt", "createdAt", "title"]).optional(),

  /**
   * Sort direction
   */
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

/**
 * Type inference for filter options
 */
export type SearchFilterOptions = z.infer<typeof searchFilterSchema>;

/**
 * Helper: Extract error messages from Zod error
 *
 * @param error - Zod validation error
 * @returns Array of user-friendly error messages
 *
 * @example
 * const result = safeValidateSearchQuery({ query: "" });
 * if (!result.success) {
 *   const messages = getValidationErrors(result.error);
 *   console.log(messages); // ["Search query cannot be empty"]
 * }
 */
export function getValidationErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}

/**
 * Validation constants
 * Centralized limits for consistency
 */
export const SEARCH_VALIDATION = {
  QUERY_MIN_LENGTH: 3,
  QUERY_MAX_LENGTH: 500,
  MAX_RESULTS_LIMIT: 100,
  MIN_SIMILARITY: 0,
  MAX_SIMILARITY: 1,
  DEFAULT_MIN_SIMILARITY: 0.6,
  DEFAULT_MAX_RESULTS: 20,
} as const;
