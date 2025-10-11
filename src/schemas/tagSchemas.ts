import { z } from "zod";

/**
 * Schema for creating a new tag
 * Tag names are normalized to lowercase for consistency
 */
export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be 50 characters or less")
    .trim()
    .transform((val) => val.toLowerCase()),
});

/**
 * Schema for updating an existing tag
 */
export const updateTagSchema = z.object({
  tagId: z.cuid("Invalid tag ID"),
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be 50 characters or less")
    .trim()
    .transform((val) => val.toLowerCase()),
});
/**
 * Schema for deleting a tag
 */
export const deleteTagSchema = z.object({
  tagId: z.cuid("Invalid tag ID"),
});
/**
 * Schema for adding a tag to a note
 */
export const addTagToNoteSchema = z.object({
  noteId: z.cuid("Invalid note ID"),
  tagId: z.cuid("Invalid tag ID"),
});

/**
 * Schema for removing a tag from a note
 */
export const removeTagFromNoteSchema = z.object({
  noteId: z.cuid("Invalid note ID"),
  tagId: z.cuid("Invalid tag ID"),
});

/**
 * Schema for getting notes by tag
 */
export const getNotesByTagSchema = z.object({
  tagId: z.cuid("Invalid tag ID"),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type DeleteTagInput = z.infer<typeof deleteTagSchema>;
export type AddTagToNoteInput = z.infer<typeof addTagToNoteSchema>;
export type RemoveTagFromNoteInput = z.infer<typeof removeTagFromNoteSchema>;
export type GetNotesByTagInput = z.infer<typeof getNotesByTagSchema>;
