/**
 * Folder Validation Utilities
 *
 * Efficient validation helpers for folder operations.
 * Uses in-memory tree walking to avoid recursive database queries.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Maximum folder nesting depth
 * 0 = Root, 1 = Child, 2 = Grandchild
 */
export const MAX_FOLDER_DEPTH = 2;

type FolderParentMap = Map<string, string | null>;

interface MinimalFolder {
  id: string;
  parentId: string | null;
}

/**
 * Builds a parent map for efficient tree traversal
 *
 * @param folders - Array of folders with id and parentId
 * @returns Map of folderId -> parentId
 *
 * @example
 * const map = buildParentMap(folders);
 * // Map { 'f1' => null, 'f2' => 'f1', 'f3' => 'f2' }
 */
export function buildParentMap(folders: MinimalFolder[]): FolderParentMap {
  const map = new Map<string, string | null>();

  for (const folder of folders) {
    map.set(folder.id, folder.parentId);
  }

  return map;
}

/**
 * Checks if targetId is a descendant of folderId
 *
 * Walks up the tree from targetId, checking if we encounter folderId.
 * Uses in-memory traversal for O(depth) performance (max 3 iterations).
 *
 * @param folderId - The folder we're checking against
 * @param targetId - The potential descendant
 * @param folders - All user folders (for building parent map)
 * @returns true if targetId is a descendant of folderId
 *
 * @example
 * // Tree: F1 -> F2 -> F3
 * isDescendant('F1', 'F3', folders) // true
 * isDescendant('F2', 'F1', folders) // false
 * isDescendant('F1', 'F1', folders) // false (same folder)
 */

export function isDescendant(
  folderId: string,
  targetId: string | null,
  folders: MinimalFolder[]
): boolean {
  // If no target or same folder, not a descendant
  if (!targetId || targetId === folderId) {
    return false;
  }

  // Build parent map for efficient lookup
  const parentMap = buildParentMap(folders);

  // Walk up the tree from targetId
  let currentId: string | null = targetId;
  let iterations = 0;
  const MAX_ITERATIONS = 10; // Safety check (should never exceed 3 with depth limit)

  while (currentId && iterations < MAX_ITERATIONS) {
    // Get parent of current folder
    const parentId = parentMap.get(currentId);

    // If parent doesn't exist, we've reached the root
    if (parentId === undefined) {
      break;
    }

    // If parent is the folder we're checking, it's a descendant
    if (parentId === folderId) {
      return true;
    }

    // Move up the tree
    currentId = parentId;
    iterations++;
  }

  // Reached root without finding folderId
  return false;
}

/**
 * Validates if moving a folder would create a circular reference
 *
 * @param folderId - The folder being moved
 * @param newParentId - The new parent folder
 * @param folders - All user folders
 * @returns Error message if circular reference detected, null if valid
 *
 * @example
 * validateCircularReference('f1', 'f2', folders)
 * // Returns: "Cannot move folder: would create circular reference"
 */
export function validateCircularReference(
  folderId: string,
  newParentId: string | null,
  folders: MinimalFolder[]
): string | null {
  // No parent means root level - always valid
  if (!newParentId) {
    return null;
  }

  // Cannot be own parent
  if (newParentId === folderId) {
    return "Folder cannot be its own parent";
  }

  // Check if new parent is a descendant
  if (isDescendant(folderId, newParentId, folders)) {
    return "Cannot move folder: would create circular reference";
  }

  return null;
}

/**
 * Validates if folder name is duplicate within same parent
 *
 * Uses case-insensitive comparison to prevent confusing duplicates.
 * Allows duplicate names across different parents.
 * Excludes default (Inbox) folders from validation.
 *
 * @param userId - User ID
 * @param name - Folder name to check (will be trimmed)
 * @param parentId - Parent folder ID (null for root level)
 * @param excludeFolderId - Folder ID to exclude from check (for updates)
 * @returns Error message if duplicate found, null if valid
 *
 * @example
 * // Check if "CS101" exists in root
 * await validateDuplicateName(userId, "CS101", null)
 * // Returns: "Folder name must be unique within the same parent"
 *
 * // Check if "CS101" exists in root, excluding current folder
 * await validateDuplicateName(userId, "CS101", null, "folder-id")
 * // Returns: null (if only match is the excluded folder)
 */
export async function validateDuplicateName(
  userId: string,
  name: string,
  parentId: string | null,
  excludeFolderId?: string
): Promise<string | null> {
  const trimmedName = name.trim();

  // Build where clause with proper Prisma types
  const whereClause: Prisma.FolderWhereInput = {
    userId,
    parentId: parentId ?? null,
    isDefault: false, // Exclude Inbox folders from duplicate check
    name: {
      equals: trimmedName,
      mode: "insensitive", // Case-insensitive comparison
    },
  };

  // For updates, exclude the current folder
  if (excludeFolderId) {
    whereClause.id = { not: excludeFolderId };
  }

  // Check for duplicate
  const duplicate = await prisma.folder.findFirst({
    where: whereClause,
    select: { id: true },
  });

  if (duplicate) {
    return "Folder name must be unique within the same parent";
  }

  return null;
}
