/**
 * Folder Utility Functions
 *
 * Shared helpers for folder operations across the app.
 * Used by FolderSelector, AI prompts, and folder management.
 */

import type { FolderOption } from "@/types/folderTypes";

/**
 * Build hierarchical folder list with proper sorting
 *
 * Sorts folders by depth first (0, 1, 2), then alphabetically within same depth.
 * This creates a natural hierarchy: parents appear before children.
 *
 * @param folders - Array of folders to sort
 * @returns Sorted array maintaining hierarchical order
 */
export function buildHierarchicalFolders(
  folders: FolderOption[]
): FolderOption[] {
  return [...folders].sort((a, b) => {
    // Sort by depth first (0, 1, 2)
    if (a.depth !== b.depth) return a.depth - b.depth;
    // Then alphabetically within same depth
    return a.name.localeCompare(b.name);
  });
}

/**
 * Format folders as indented text for AI context
 *
 * Converts folder hierarchy into human-readable format for AI prompts.
 * Reuses buildHierarchicalFolders for consistent sorting.
 *
 * Example output:
 * - CS 101
 *   ├─ Algorithms
 *   └─ Data Structures
 * - Web Dev
 *
 * @param folders - Array of folders to format
 * @returns Formatted string with indentation
 */
export function formatFoldersForAI(folders: FolderOption[]): string {
  if (folders.length === 0) {
    return "No existing folders yet.";
  }

  // Reuse hierarchical sorting logic
  const sorted = buildHierarchicalFolders(folders);
  const result: string[] = [];

  sorted.forEach((folder) => {
    // Create indentation based on depth
    const indent = "  ".repeat(folder.depth);

    // Choose connector symbol based on depth
    let connector = "-";
    if (folder.depth === 1) connector = "├─";
    if (folder.depth === 2) connector = "└─";

    result.push(`${indent}${connector} ${folder.name}`);
  });

  return result.join("\n");
}

/**
 * Build full path for a folder (e.g., "Algorithms/Sorting")
 *
 * Recursively builds path by traversing parent hierarchy.
 *
 * @param folder - Folder to build path for
 * @param allFolders - All folders (needed to find parents)
 * @returns Full path string (e.g., "Parent/Child")
 *
 * @example
 * // Folder: { name: "Sorting", parentId: "1" }
 * // Parent: { id: "1", name: "Algorithms", parentId: null }
 * // Result: "Algorithms/Sorting"
 */
export function buildFolderPath(
  folder: FolderOption,
  allFolders: FolderOption[]
): string {
  if (!folder.parentId) {
    return folder.name; // Root folder
  }

  // Find parent and recursively build path
  const parent = allFolders.find((f) => f.id === folder.parentId);
  if (!parent) {
    return folder.name; // Parent not found (shouldn't happen)
  }

  return `${buildFolderPath(parent, allFolders)}/${folder.name}`;
}

/**
 * Find folder by exact path match (e.g., "Algorithms/Sorting")
 *
 * Case-insensitive matching. Prefers most specific (deepest) match.
 *
 * @param folderPath - Path suggested by AI (e.g., "Algorithms/Sorting" or "Algorithms")
 * @param folders - All user folders
 * @returns Matched folder or null
 *
 * @example
 * // User has: "Algorithms" (root), "Sorting" (child of Algorithms)
 * findFolderByPath("Algorithms/Sorting", folders)
 * // Returns: { id: "2", name: "Sorting", parentId: "1", depth: 1 }
 *
 * findFolderByPath("Algorithms", folders)
 * // Returns: { id: "1", name: "Algorithms", parentId: null, depth: 0 }
 */
export function findFolderByPath(
  folderPath: string,
  folders: FolderOption[]
): FolderOption | null {
  if (!folderPath || folders.length === 0) return null;

  const normalizedPath = folderPath.toLowerCase().trim();

  // Build paths for all folders and find matches
  const matches = folders
    .map((folder) => ({
      folder,
      path: buildFolderPath(folder, folders).toLowerCase(),
    }))
    .filter(({ path }) => path === normalizedPath);

  if (matches.length === 0) return null;

  // If multiple matches (shouldn't happen), return deepest one
  matches.sort((a, b) => b.folder.depth - a.folder.depth);
  return matches[0].folder;
}
