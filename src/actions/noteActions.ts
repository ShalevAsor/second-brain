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
 * Creates a new note with optional tags
 * Tags are created/linked automatically in a transaction
 */
export async function createNote(input: CreateNoteInput) {
  try {
    const userId = await requireAuth();
    const validated = createNoteSchema.parse(input);

    console.log("📝 [Create Note] Creating note:");
    console.log("   Title:", validated.title);
    console.log("   Folder ID:", validated.folderId || "null");
    console.log("   Tags:", validated.tags.join(", ") || "none");
    console.log("   Auto-organized:", validated.isAutoOrganized);

    const note = await prisma.$transaction(
      async (tx) => {
        // 1. Create the note first
        const newNote = await tx.note.create({
          data: {
            title: validated.title,
            content: validated.content,
            folderId: validated.folderId ?? null,
            isAutoOrganized: validated.isAutoOrganized ?? false,
            userId,
            contentUpdatedAt: new Date(),
          },
        });

        console.log("✅ [Create Note] Note created with ID:", newNote.id);

        // 2. Handle tags if provided - PARALLEL PROCESSING
        if (validated.tags && validated.tags.length > 0) {
          console.log(
            "🏷️  [Create Note] Processing",
            validated.tags.length,
            "tags..."
          );

          // ✅ FIX: Process all tags in parallel
          await Promise.all(
            validated.tags.map(async (tagName) => {
              // Find or create tag
              const tag = await tx.tag.upsert({
                where: {
                  userId_name: {
                    userId,
                    name: tagName,
                  },
                },
                create: {
                  name: tagName,
                  userId,
                },
                update: {},
              });

              console.log(
                "   Tag:",
                tagName,
                "→",
                tag.id,
                "(created or existing)"
              );

              // Link tag to note
              await tx.noteTag.upsert({
                where: {
                  noteId_tagId: {
                    noteId: newNote.id,
                    tagId: tag.id,
                  },
                },
                create: {
                  noteId: newNote.id,
                  tagId: tag.id,
                },
                update: {},
              });
            })
          );

          console.log("✅ [Create Note] All tags linked successfully");
        }

        // 3. Return note with full relations
        return await tx.note.findUnique({
          where: { id: newNote.id },
          include: {
            folder: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });
      },
      {
        maxWait: 10000, // ✅ Increase max wait time to 10 seconds
        timeout: 15000, // ✅ Increase timeout to 15 seconds
      }
    );

    console.log("✅ [Create Note] Complete! Note has:");
    console.log("   Folder:", note?.folder?.name || "none");
    console.log(
      "   Tags:",
      note?.tags.map((t) => t.tag.name).join(", ") || "none"
    );

    revalidatePath("/");

    return createSuccessResult(note, "Note created successfully");
  } catch (error) {
    console.error("❌ [Create Note] Error:", error);
    logger.error("Error creating note:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Updates an existing note with optional tags
 * If tags provided, replaces all existing tags with new set
 */
export async function updateNote(input: UpdateNoteInput) {
  try {
    const userId = await requireAuth();
    const validated = updateNoteSchema.parse(input);
    const { id, tags, ...updateData } = validated;

    const note = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch existing note (we need it for comparison and auth check)
        const existingNote = await tx.note.findUnique({
          where: { id },
          select: {
            userId: true,
            title: true,
            content: true,
          },
        });

        if (!existingNote) {
          throw new Error("Note not found");
        }

        if (existingNote.userId !== userId) {
          throw new Error("Unauthorized");
        }

        // 2. Check if content changed
        const titleChanged =
          updateData.title !== undefined &&
          updateData.title !== existingNote.title;

        const contentChanged =
          updateData.content !== undefined &&
          updateData.content !== existingNote.content;

        const isContentUpdate = titleChanged || contentChanged;

        // 3. Update note
        await tx.note.update({
          where: { id },
          data: {
            title: updateData.title,
            content: updateData.content,
            folderId:
              updateData.folderId === undefined
                ? undefined
                : updateData.folderId ?? null,
            isAutoOrganized: updateData.isAutoOrganized,
            //  Conditionally update contentUpdatedAt
            ...(isContentUpdate && { contentUpdatedAt: new Date() }),
          },
        });

        // 4. Handle tags if provided
        if (tags !== undefined) {
          // Remove all existing tag connections
          await tx.noteTag.deleteMany({
            where: { noteId: id },
          });

          // Add new tags - PARALLEL PROCESSING
          if (tags.length > 0) {
            await Promise.all(
              tags.map(async (tagName) => {
                const tag = await tx.tag.upsert({
                  where: {
                    userId_name: {
                      userId,
                      name: tagName,
                    },
                  },
                  create: {
                    name: tagName,
                    userId,
                  },
                  update: {},
                });

                await tx.noteTag.create({
                  data: {
                    noteId: id,
                    tagId: tag.id,
                  },
                });
              })
            );
          }
        }

        // 5. Return updated note with relations
        return await tx.note.findUnique({
          where: { id },
          include: {
            folder: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 15000,
      }
    );

    revalidatePath("/");
    return createSuccessResult(note, "Note updated successfully");
  } catch (error) {
    console.error("❌ [Update Note] Error:", error);
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
    const deletedNote = await prisma.note.delete({
      where: { id: noteId },
    });

    // 4. Revalidate cache
    revalidatePath("/");

    return createSuccessResult(deletedNote, "Note deleted successfully");
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
