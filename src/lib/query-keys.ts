// src/lib/query-keys.ts

/**
 * Centralized query keys for React Query
 * Naming convention:
 * - Queries: noteKeys.all(), noteKeys.detail(id)
 * - Constants: NOTES_QUERY_KEY (for broad invalidations)
 */

// ================================================================
// BASE QUERY KEYS (for broad invalidations)
// =================================================================

export const NOTES_QUERY_KEY = ["notes"] as const;
export const FOLDERS_QUERY_KEY = ["folders"] as const;
export const TAGS_QUERY_KEY = ["tags"] as const;
export const FAVORITES_QUERY_KEY = ["favorites"] as const;
export const SEMANTIC_SEARCH_QUERY_KEY = ["semantic-search"] as const;
// =================================================================
// QUERY KEY FACTORIES (for specific queries)
// ==================================================================

/**
 * Note query keys
 * Use these for specific queries, use NOTES_QUERY_KEY for invalidating all notes
 */
export const noteKeys = {
  // Base key
  all: () => ["notes", "all"] as const,

  // Filtered lists
  byFolder: (folderId: string) => ["notes", "folder", folderId] as const,
  byTag: (tagId: string) => ["notes", "tag", tagId] as const,
  favorites: () => FAVORITES_QUERY_KEY,

  // Single note
  detail: (noteId: string) => ["notes", noteId] as const,
} as const;

/**
 * Folder query keys
 */
export const folderKeys = {
  all: () => FOLDERS_QUERY_KEY,
  detail: (folderId: string) => ["folders", folderId] as const,
  roots: () => ["folders", "roots"] as const,
} as const;

/**
 * Tag query keys
 */
export const tagKeys = {
  all: () => TAGS_QUERY_KEY,
  detail: (tagId: string) => ["tags", tagId] as const,
} as const;

/**
 * Semantic search query keys
 * Use these for AI-powered search queries
 */
export const semanticSearchKeys = {
  // Base key (for invalidating all semantic searches)
  all: () => SEMANTIC_SEARCH_QUERY_KEY,

  // Search results with specific query and filters
  search: (
    query: string,
    options?: {
      minSimilarity?: number;
      maxResults?: number;
      folderId?: string | null;
      tagIds?: string[];
    }
  ) => ["semantic-search", "results", query, options] as const,

  // Embedding status
  status: () => ["semantic-search", "status"] as const,
} as const;
