/**
 * Folder Configuration Constants
 */

/**
 * Maximum folder nesting depth
 * 0 = Root, 1 = Child, 2 = Grandchild
 */
export const MAX_FOLDER_DEPTH = 2;

/**
 * Folder depth levels for display
 */
export const FOLDER_DEPTH_LABELS = {
  0: "Root Level",
  1: "Subfolder",
  2: "Nested Subfolder",
} as const;
