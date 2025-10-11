import type { Folder, FolderColor } from "@prisma/client";

/**
 * Folder with relations from Prisma queries
 * This is what we get back from database queries that include relations
 */
export type FolderWithRelations = Folder & {
  children: Folder[];
  _count: {
    notes: number;
  };
};

/**
 * Folder tree data structure for UI rendering
 * Flattened structure optimized for component rendering
 */
export interface FolderTreeData {
  id: string;
  name: string;
  noteCount: number;
  parentId: string | null;
  color: FolderColor;
  isDefault: boolean;
  children: FolderTreeData[];
}

/**
 * Simplified folder for dropdowns and selection
 * Minimal data needed for parent selection, etc.
 */
export interface FolderOption {
  id: string;
  name: string;
  parentId: string | null;
  isDefault: boolean;
  depth: number;
}
