// src/lib/schemas/noteSchemas.ts
import { z } from "zod";

// For creating new notes
export const createNoteSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content cannot be empty"),
  // folderId can be null or undefined
  folderId: z.cuid("Invalid folder ID format").nullish(),
  // boolean with default
  isAutoOrganized: z.boolean().default(false),
  // aiSuggestions can be null or undefined (JSON field in Prisma)
  aiSuggestions: z.record(z.string(), z.any()).nullable().optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag name cannot be empty")
        .max(50, "Tag name too long")
        .trim()
        .transform((val) => val.toLowerCase())
    )
    .optional()
    .default([]),
});

// For updating existing notes (requires id, other fields optional)
export const updateNoteSchema = z.object({
  id: z.cuid("Invalid folder ID format"),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .optional(),
  content: z.string().min(1, "Content cannot be empty").optional(),
  folderId: z.cuid("Invalid folder ID format").nullish(),
  isAutoOrganized: z.boolean().optional(),
  aiSuggestions: z.record(z.string(), z.any()).nullable().optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag name cannot be empty")
        .max(50, "Tag name too long")
        .trim()
        .transform((val) => val.toLowerCase())
    )
    .optional(),
});

// For toggling favorite status
export const toggleFavoriteSchema = z.object({
  noteId: z.cuid("Invalid note ID format"),
});

// Type inference
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type ToggleFavoriteInput = z.infer<typeof toggleFavoriteSchema>;
