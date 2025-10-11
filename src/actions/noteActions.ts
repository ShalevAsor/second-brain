// src/actions/noteActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import {
  createNoteSchema,
  updateNoteSchema,
  toggleFavoriteSchema,
  type CreateNoteInput,
  type UpdateNoteInput,
  type ToggleFavoriteInput,
} from "@/schemas/noteSchemas";
import { createSuccessResult, createErrorResult } from "@/lib/actionHelpers";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { ActionResult } from "@/types/actionTypes";

/**
 * Creates a new note
 * Note: Tags are now managed separately via tagActions (addTagToNote)
 */
export async function createNote(input: CreateNoteInput) {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Validate input
    const validated = createNoteSchema.parse(input);

    // 3. Create note (without tags - they're managed separately now)
    const note = await prisma.note.create({
      data: {
        title: validated.title,
        content: validated.content,
        folderId: validated.folderId ?? null,
        isAutoOrganized: validated.isAutoOrganized ?? false,
        aiSuggestions: validated.aiSuggestions ?? Prisma.JsonNull,
        userId,
      },
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 4. Revalidate cache
    revalidatePath("/");

    return createSuccessResult(note, "Note created successfully");
  } catch (error) {
    logger.error("Error creating note:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Updates an existing note
 * Note: Tags are now managed separately via tagActions (addTagToNote/removeTagFromNote)
 */
export async function updateNote(input: UpdateNoteInput) {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Validate input
    const validated = updateNoteSchema.parse(input);

    // 3. Verify note ownership
    const existingNote = await prisma.note.findUnique({
      where: { id: validated.id },
      select: { userId: true },
    });

    if (!existingNote) {
      return createErrorResult("Note not found");
    }

    if (existingNote.userId !== userId) {
      return createErrorResult("Unauthorized");
    }

    // 4. Update note (excluding tags - they're managed separately)
    const { id, ...updateFields } = validated;

    // Transform the data to Prisma's expected format
    const updateData = {
      title: updateFields.title,
      content: updateFields.content,
      folderId:
        updateFields.folderId === undefined
          ? undefined
          : updateFields.folderId ?? null,
      isAutoOrganized: updateFields.isAutoOrganized,
      aiSuggestions:
        updateFields.aiSuggestions === undefined
          ? undefined
          : updateFields.aiSuggestions ?? Prisma.JsonNull,
    };

    const note = await prisma.note.update({
      where: { id },
      data: updateData,
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 5. Revalidate cache
    revalidatePath("/");

    return createSuccessResult(note, "Note updated successfully");
  } catch (error) {
    logger.error("Error updating note:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Deletes a note
 */
export async function deleteNote(noteId: string) {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Verify note ownership
    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
      select: { userId: true },
    });

    if (!existingNote) {
      return createErrorResult("Note not found");
    }

    if (existingNote.userId !== userId) {
      return createErrorResult("Unauthorized");
    }

    // 3. Delete note (NoteTag junction table rows cascade automatically)
    await prisma.note.delete({
      where: { id: noteId },
    });

    // 4. Revalidate cache
    revalidatePath("/");

    return createSuccessResult(null, "Note deleted successfully");
  } catch (error) {
    logger.error("Error deleting note:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Gets all notes for the authenticated user
 */
export async function getAllNotes() {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Fetch notes with tags
    const notes = await prisma.note.findMany({
      where: { userId },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return createSuccessResult(notes);
  } catch (error) {
    logger.error("Error fetching notes:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Gets a single note by ID
 */
export async function getNote(noteId: string) {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Fetch note with tags
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      return createErrorResult("Note not found");
    }

    // 3. Verify ownership
    if (note.userId !== userId) {
      return createErrorResult("Unauthorized");
    }

    return createSuccessResult(note);
  } catch (error) {
    logger.error("Error fetching note:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Gets notes by folder ID
 */
export async function getNotesByFolder(folderId: string) {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Verify folder ownership
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      select: { userId: true },
    });

    if (!folder) {
      return createErrorResult("Folder not found");
    }

    if (folder.userId !== userId) {
      return createErrorResult("Unauthorized");
    }

    // 3. Fetch notes in folder with tags
    const notes = await prisma.note.findMany({
      where: {
        userId,
        folderId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return createSuccessResult(notes);
  } catch (error) {
    logger.error("Error fetching notes by folder:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Gets notes by tag ID (for tag view)
 */
export async function getNotesByTag(tagId: string) {
  try {
    // 1. Authenticate user
    const userId = await requireAuth();

    // 2. Verify tag ownership
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { userId: true },
    });

    if (!tag) {
      return createErrorResult("Tag not found");
    }

    if (tag.userId !== userId) {
      return createErrorResult("Unauthorized");
    }

    // 3. Fetch notes with this tag
    const notes = await prisma.note.findMany({
      where: {
        userId,
        tags: {
          some: {
            tagId: tagId,
          },
        },
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return createSuccessResult(notes);
  } catch (error) {
    logger.error("Error fetching notes by tag:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Toggle the favorite status of a note
 */
export async function toggleNoteFavorite(
  input: ToggleFavoriteInput
): Promise<ActionResult<{ isFavorite: boolean; title: string }>> {
  try {
    // authenticate user
    const userId = await requireAuth();
    // validate input
    const { noteId } = toggleFavoriteSchema.parse(input);
    // verify note exists and belong to this user
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        id: true,
        userId: true,
        isFavorite: true,
      },
    });
    if (!note) {
      return createErrorResult("Note not found");
    }
    if (note.userId !== userId) {
      return createErrorResult("Unauthorized");
    }
    // Toggle favorite status
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: { isFavorite: !note.isFavorite },
      select: { isFavorite: true, title: true },
    });
    // revalidate cache
    revalidatePath("/");
    revalidatePath("/notes");
    return createSuccessResult({
      isFavorite: updatedNote.isFavorite,
      title: updatedNote.title,
    });
  } catch (error) {
    logger.error("Error toggle note isFavorite status:", error);
    return createErrorResult({ error });
  }
}

/**
 * Fetch all favorite notes for the current user
 */
export async function getFavoriteNotes() {
  try {
    const userId = await requireAuth();

    const favorites = await prisma.note.findMany({
      where: {
        userId,
        isFavorite: true,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 10,
    });

    return createSuccessResult(favorites);
  } catch (error) {
    logger.error("Error fetching favorite notes:", { error });
    return createErrorResult({ error });
  }
}
