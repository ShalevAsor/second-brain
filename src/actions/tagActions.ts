"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createSuccessResult, createErrorResult } from "@/lib/actionHelpers";
import {
  createTagSchema,
  updateTagSchema,
  deleteTagSchema,
  addTagToNoteSchema,
  removeTagFromNoteSchema,
  getNotesByTagSchema,
  type CreateTagInput,
  type UpdateTagInput,
  type DeleteTagInput,
  type AddTagToNoteInput,
  type RemoveTagFromNoteInput,
  type GetNotesByTagInput,
} from "@/schemas/tagSchemas";
import type { ActionResult } from "@/types/actionTypes";
import type { Tag, Note } from "@prisma/client";
import { logger } from "@/lib/logger";

// Type for Tag with note count
export type TagWithCount = Tag & {
  _count: {
    notes: number;
  };
};

/**
 * Get all tags for the current user with note counts
 * Sorted by note count (descending) then by name
 */
export async function getAllTags(): Promise<ActionResult<TagWithCount[]>> {
  try {
    const userId = await requireAuth();

    const tags = await prisma.tag.findMany({
      where: { userId },
      include: {
        _count: {
          select: { notes: true },
        },
      },
      orderBy: [
        { notes: { _count: "desc" } }, // Most used tags first
        { name: "asc" }, // Then alphabetically
      ],
    });
    return createSuccessResult(tags);
  } catch (error) {
    logger.error("Error in getAllTags:", error);
    return createErrorResult({ error });
  }
}

/**
 * Create a new tag
 * If tag already exists, returns the existing tag
 */
export async function createTag(
  input: CreateTagInput
): Promise<ActionResult<Tag>> {
  try {
    const userId = await requireAuth();
    const validated = createTagSchema.parse(input);
    // check if tag already exists (case-insensitive due to lowercase transform)
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId,
          name: validated.name,
        },
      },
    });
    // if tag exists, return it instead of creating duplicate
    if (existingTag) {
      return createSuccessResult(existingTag);
    }
    const tag = await prisma.tag.create({
      data: {
        name: validated.name,
        userId,
      },
    });
    revalidatePath("/");
    return createSuccessResult(tag);
  } catch (error) {
    logger.error("Error in createTag:", error);
    return createErrorResult({ error });
  }
}

/**
 * Update (rename) a tag
 * Affects all notes using this tag automatically
 */
export async function updateTag(
  input: UpdateTagInput
): Promise<ActionResult<Tag>> {
  try {
    const userId = await requireAuth();
    const validated = updateTagSchema.parse(input);
    // Verify tag exists and belongs to user
    const existingTag = await prisma.tag.findUnique({
      where: { id: validated.tagId },
    });
    if (!existingTag) {
      return createErrorResult({ message: "Tag not found" });
    }

    if (existingTag.userId !== userId) {
      return createErrorResult({ message: "Unauthorized" });
    }
    // Check if new name conflicts with another tag
    const conflictingTag = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId,
          name: validated.name,
        },
      },
    });
    if (conflictingTag && conflictingTag.id !== validated.tagId) {
      return createErrorResult({
        message: "A tag with this name already exists",
      });
    }
    const tag = await prisma.tag.update({
      where: { id: validated.tagId },
      data: { name: validated.name },
    });

    revalidatePath("/");
    return createSuccessResult(tag);
  } catch (error) {
    logger.error("Error in updateTag:", error);
    return createErrorResult({ error });
  }
}
/**
 * Delete a tag
 * Cascade removes tag from all notes automatically
 */
export async function deleteTag(
  input: DeleteTagInput
): Promise<ActionResult<Tag>> {
  try {
    const userId = await requireAuth();
    const validated = deleteTagSchema.parse(input);

    // Verify tag exists and belongs to user
    const existingTag = await prisma.tag.findUnique({
      where: { id: validated.tagId },
    });
    if (!existingTag) {
      return createErrorResult({ message: "Tag not found" });
    }

    if (existingTag.userId !== userId) {
      return createErrorResult({ message: "Unauthorized" });
    }
    // Delete tag (cascade removes from note_tags junction table)
    const tag = await prisma.tag.delete({
      where: { id: validated.tagId },
    });

    revalidatePath("/");
    return createSuccessResult(tag);
  } catch (error) {
    logger.error("Error in deleteTag:", error);
    return createErrorResult({ error });
  }
}

/**
 * Add a tag to a note
 * Creates the connection in the junction table
 */
export async function addTagToNote(
  input: AddTagToNoteInput
): Promise<ActionResult<void>> {
  try {
    const userId = await requireAuth();
    const validated = addTagToNoteSchema.parse(input);

    // Verify note belongs to user
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
    });

    if (!note || note.userId !== userId) {
      return createErrorResult({ message: "Note not found" });
    }

    // Verify tag belongs to user
    const tag = await prisma.tag.findUnique({
      where: { id: validated.tagId },
    });

    if (!tag || tag.userId !== userId) {
      return createErrorResult({ message: "Tag not found" });
    }

    // Create connection (if already exists, Prisma will throw and we catch it)
    await prisma.noteTag.create({
      data: {
        noteId: validated.noteId,
        tagId: validated.tagId,
      },
    });

    revalidatePath("/");
    return createSuccessResult(undefined);
  } catch (error) {
    logger.error("Error in addTagToNote:", error);

    // If connection already exists, treat as success
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return createSuccessResult(undefined);
    }
    return createErrorResult({ error });
  }
}

/**
 * Remove a tag from a note
 * Deletes the connection in the junction table
 */
export async function removeTagFromNote(
  input: RemoveTagFromNoteInput
): Promise<ActionResult<void>> {
  try {
    const userId = await requireAuth();
    const validated = removeTagFromNoteSchema.parse(input);

    // Verify note belongs to user
    const note = await prisma.note.findUnique({
      where: { id: validated.noteId },
    });

    if (!note || note.userId !== userId) {
      return createErrorResult({ message: "Note not found" });
    }

    // Delete connection (if doesn't exist, deleteMany returns 0 but doesn't throw)
    await prisma.noteTag.deleteMany({
      where: {
        noteId: validated.noteId,
        tagId: validated.tagId,
      },
    });

    revalidatePath("/");
    return createSuccessResult(undefined);
  } catch (error) {
    logger.error("Error in removeTagFromNote:", error);
    return createErrorResult({ error });
  }
}
/**
 * Get all notes that have a specific tag
 * Used for tag filtering in the UI
 */
export async function getNotesByTag(
  input: GetNotesByTagInput
): Promise<ActionResult<Note[]>> {
  try {
    const userId = await requireAuth();
    const validated = getNotesByTagSchema.parse(input);

    // Verify tag belongs to user
    const tag = await prisma.tag.findUnique({
      where: { id: validated.tagId },
    });

    if (!tag || tag.userId !== userId) {
      return createErrorResult({ message: "Tag not found" });
    }

    // Get all notes with this tag
    const notes = await prisma.note.findMany({
      where: {
        userId,
        tags: {
          some: {
            tagId: validated.tagId,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return createSuccessResult(notes);
  } catch (error) {
    logger.error("Error in getNotesByTag:", error);
    return createErrorResult({ error });
  }
}
