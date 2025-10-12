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

// ==============================================================
// HELPER: INVALIDATE MULTIPLE KEYS
// ===============================================================

/**
 * Helper type for query client invalidation
 * Usage: await invalidateMultiple(queryClient, [NOTES_QUERY_KEY, TAGS_QUERY_KEY])
 */
export type QueryKey = readonly string[] | readonly unknown[];

/**
 * Common invalidation patterns for mutations
 * Use these to ensure consistency
 */
export const invalidationGroups = {
  // When notes are created/updated/deleted
  notes: [NOTES_QUERY_KEY] as const,

  // When note content changes (affects tags/folders/favorites)
  noteWithRelations: [
    NOTES_QUERY_KEY,
    TAGS_QUERY_KEY,
    FOLDERS_QUERY_KEY,
  ] as const,

  // When note is deleted (affects everything)
  noteDelete: [
    NOTES_QUERY_KEY,
    TAGS_QUERY_KEY,
    FOLDERS_QUERY_KEY,
    FAVORITES_QUERY_KEY,
  ] as const,

  // When folders change (affects notes that display folder names)
  folders: [FOLDERS_QUERY_KEY, NOTES_QUERY_KEY] as const,

  // When tags change (affects notes that display tag names)
  tags: [TAGS_QUERY_KEY, NOTES_QUERY_KEY] as const,

  // When favorites change
  favorites: [FAVORITES_QUERY_KEY, NOTES_QUERY_KEY] as const,
} as const;
