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
