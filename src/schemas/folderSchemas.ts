// src/schemas/folderSchemas.ts
import { z } from "zod";
import { FolderColor } from "@prisma/client";

/**
 * Folder Color Values
 * Extract enum values as a tuple for Zod validation
 * Dynamically generated from Prisma enum to maintain single source of truth
 */
const folderColorValues = Object.values(FolderColor) as [string, ...string[]];

/**
 * Schema for creating a new folder
 * Used when user creates a folder via sidebar [+] button or AI auto-organization
 */
export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name too long")
    .trim(),
  parentId: z.cuid().nullable().optional(),
  color: z
    .enum(folderColorValues)
    .default(FolderColor.GRAY)
    .transform((val) => val as FolderColor),
});

/**
 * Schema for updating an existing folder
 * Used when user edits folder via context menu
 */
export const updateFolderSchema = z.object({
  id: z.cuid("Invalid folder ID"),
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name too long")
    .trim()
    .optional(),
  parentId: z.cuid().nullable().optional(),
  color: z
    .enum(folderColorValues)
    .transform((val) => val as FolderColor)
    .optional(),
});

/**
 * Schema for deleting a folder
 * Validates folder ID before deletion
 */
export const deleteFolderSchema = z.object({
  id: z.cuid("Invalid folder ID"),
});

// Type inference for type-safe form handling
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;

/**
 * Re-export for convenient imports in components
 */
export { FolderColor };
