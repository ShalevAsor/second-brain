"use server";

import { prisma } from "@/lib/prisma";
import {
  createFolderSchema,
  updateFolderSchema,
  deleteFolderSchema,
  type CreateFolderInput,
  type UpdateFolderInput,
  type DeleteFolderInput,
  FolderColor,
} from "@/schemas/folderSchemas";
import { createSuccessResult, createErrorResult } from "@/lib/actionHelpers";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { ActionResult } from "@/types/actionTypes";
import { MAX_FOLDER_DEPTH } from "@/constants/folder-constants";
import { Prisma } from "@prisma/client";
import {
  validateCircularReference,
  validateDuplicateName,
} from "@/lib/folderValidation";

/**
 * Create a new folder
 * Supports manual creation (via UI) and AI auto-organization
 */
export async function createFolder(input: CreateFolderInput) {
  try {
    // authenticate user
    const userId = await requireAuth();
    // validate input
    const validated = createFolderSchema.parse(input);
    // Check for duplicate name in same parent
    const duplicateError = await validateDuplicateName(
      userId,
      validated.name,
      validated.parentId ?? null
    );

    if (duplicateError) {
      return createErrorResult(duplicateError);
    }
    // If parentId provided, verify it exists and belongs to user
    let parentDepth = -1; // no parent
    if (validated.parentId) {
      const parentFolder = await prisma.folder.findUnique({
        where: { id: validated.parentId },
        select: { userId: true, depth: true },
      });

      if (!parentFolder) {
        return createErrorResult("Parent folder not found");
      }

      if (parentFolder.userId !== userId) {
        return createErrorResult("Unauthorized");
      }
      if (parentFolder.depth >= MAX_FOLDER_DEPTH) {
        return createErrorResult(
          `Cannot create subfolder: maximum depth of ${
            MAX_FOLDER_DEPTH + 1
          } levels exceeded`
        );
      }

      parentDepth = parentFolder.depth;
    }

    // Create folder
    const folder = await prisma.folder.create({
      data: {
        name: validated.name,
        parentId: validated.parentId ?? null,
        color: validated.color,
        userId,
        depth: parentDepth + 1, // [0,1,2]
      },
      include: {
        parent: true,
        children: true,
      },
    });

    // Revalidate cache
    revalidatePath("/");
    return createSuccessResult(folder, "Folder created successfully");
  } catch (error) {
    logger.error("Error creating folder:", { error });
    return createErrorResult({ error });
  }
}
/**
 * Creates the default inbox folder for a new user
 * Internal use only - called from webhook
 */
export async function createInboxFolder(userId: string) {
  try {
    // Check if inbox already exists
    const existingInbox = await prisma.folder.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });

    if (existingInbox) {
      logger.info(`Inbox folder already exists for user ${userId}`);
      return createSuccessResult(existingInbox, "Inbox already exists");
    }

    // Create inbox folder
    const inbox = await prisma.folder.create({
      data: {
        name: "Inbox",
        userId,
        isDefault: true,
        parentId: null, // Root level folder
        color: FolderColor.GRAY,
      },
    });

    logger.info(`Created inbox folder for user ${userId}`);
    return createSuccessResult(inbox, "Inbox folder created successfully");
  } catch (error) {
    logger.error("Error creating inbox folder:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Updates an existing folder
 */
// export async function updateFolder(input: UpdateFolderInput) {
//   try {
//     const userId = await requireAuth();
//     const validated = updateFolderSchema.parse(input);

//     const existingFolder = await prisma.folder.findUnique({
//       where: { id: validated.id },
//       select: {
//         userId: true,
//         isDefault: true,
//         depth: true,
//         parentId: true,
//         name: true,
//       },
//     });

//     if (!existingFolder) {
//       return createErrorResult("Folder not found");
//     }

//     if (existingFolder.userId !== userId) {
//       return createErrorResult("Unauthorized");
//     }

//     if (existingFolder.isDefault && validated.name) {
//       return createErrorResult("Cannot rename the Inbox folder");
//     }

//     const updateData: Prisma.FolderUncheckedUpdateInput = {};

//     // Validate name change for duplicates
//     if (validated.name) {
//       const duplicateError = await validateDuplicateName(
//         userId,
//         validated.name,
//         existingFolder.parentId,
//         validated.id // Exclude self from duplicate check
//       );

//       if (duplicateError) {
//         return createErrorResult(duplicateError);
//       }

//       updateData.name = validated.name;
//     }

//     if (validated.name) updateData.name = validated.name;
//     if (validated.color) updateData.color = validated.color;

//     // Handle parent change
//     if (validated.parentId !== undefined) {
//       // Only recalculate if parent actually changed
//       if (validated.parentId !== existingFolder.parentId) {
//         // Fetch all user folders for circular reference check
//         // (Minimal query - only id + parentId fields)
//         const allUserFolders = await prisma.folder.findMany({
//           where: { userId },
//           select: { id: true, parentId: true },
//         });

//         // Validate circular reference
//         const circularError = validateCircularReference(
//           validated.id,
//           validated.parentId,
//           allUserFolders
//         );

//         if (circularError) {
//           return createErrorResult(circularError);
//         }

//         // Existing depth validation
//         let newParentDepth = -1;

//         if (validated.parentId) {
//           const newParent = await prisma.folder.findUnique({
//             where: { id: validated.parentId },
//             select: { userId: true, depth: true },
//           });

//           if (!newParent) {
//             return createErrorResult("Parent folder not found");
//           }

//           if (newParent.userId !== userId) {
//             return createErrorResult("Unauthorized");
//           }

//           if (newParent.depth >= MAX_FOLDER_DEPTH) {
//             return createErrorResult(
//               `Cannot move folder: would exceed maximum depth of ${
//                 MAX_FOLDER_DEPTH + 1
//               } levels`
//             );
//           }

//           newParentDepth = newParent.depth;
//         }

//         // Calculate new depth for this folder
//         const newDepth = newParentDepth + 1;

//         updateData.parentId = validated.parentId;
//         updateData.depth = newDepth;

//         // Update all children depths recursively
//         const children = await prisma.folder.findMany({
//           where: { parentId: validated.id },
//           select: { id: true },
//         });

//         // Update children in parallel
//         await Promise.all(
//           children.map((child) =>
//             updateSubFoldersTreeDepth(child.id, newDepth + 1)
//           )
//         );
//       }
//     }

//     const folder = await prisma.folder.update({
//       where: { id: validated.id },
//       data: updateData,
//       include: {
//         parent: true,
//         children: true,
//       },
//     });

//     revalidatePath("/");
//     return createSuccessResult(folder, "Folder updated successfully");
//   } catch (error) {
//     logger.error("Error updating folder:", { error });
//     return createErrorResult({ error });
//   }
// }

export async function updateFolder(input: UpdateFolderInput) {
  try {
    const userId = await requireAuth();
    const validated = updateFolderSchema.parse(input);

    const existingFolder = await prisma.folder.findUnique({
      where: { id: validated.id },
      select: {
        userId: true,
        isDefault: true,
        depth: true,
        parentId: true,
        name: true,
      },
    });

    if (!existingFolder) {
      return createErrorResult("Folder not found");
    }

    if (existingFolder.userId !== userId) {
      return createErrorResult("Unauthorized");
    }

    if (existingFolder.isDefault && validated.name) {
      return createErrorResult("Cannot rename the Inbox folder");
    }

    const updateData: Prisma.FolderUncheckedUpdateInput = {};

    // Validate name change for duplicates
    if (validated.name) {
      const duplicateError = await validateDuplicateName(
        userId,
        validated.name,
        existingFolder.parentId,
        validated.id
      );

      if (duplicateError) {
        return createErrorResult(duplicateError);
      }

      updateData.name = validated.name;
    }

    if (validated.color) updateData.color = validated.color;

    // Handle parent change
    if (validated.parentId !== undefined) {
      // Only recalculate if parent actually changed
      if (validated.parentId !== existingFolder.parentId) {
        // Fetch all user folders for circular reference check
        const allUserFolders = await prisma.folder.findMany({
          where: { userId },
          select: { id: true, parentId: true, depth: true },
        });

        // Validate circular reference
        const circularError = validateCircularReference(
          validated.id,
          validated.parentId,
          allUserFolders
        );

        if (circularError) {
          return createErrorResult(circularError);
        }

        // ✅ NEW: Find the deepest descendant of this folder
        // This tells us how many levels deep the folder tree goes
        const deepestDescendant = allUserFolders
          .filter((f) => {
            // Find all descendants by walking up the parent chain
            let currentId = f.parentId;
            while (currentId) {
              if (currentId === validated.id) return true; // This folder is a descendant
              const parent = allUserFolders.find((p) => p.id === currentId);
              currentId = parent?.parentId || null;
            }
            return false;
          })
          .reduce((max, f) => Math.max(max, f.depth), existingFolder.depth);

        // Calculate how deep the subtree is (relative depth)
        const subtreeDepth = deepestDescendant - existingFolder.depth;

        // Calculate new parent depth
        let newParentDepth = -1;

        if (validated.parentId) {
          const newParent = await prisma.folder.findUnique({
            where: { id: validated.parentId },
            select: { userId: true, depth: true },
          });

          if (!newParent) {
            return createErrorResult("Parent folder not found");
          }

          if (newParent.userId !== userId) {
            return createErrorResult("Unauthorized");
          }

          if (newParent.depth >= MAX_FOLDER_DEPTH) {
            return createErrorResult(
              `Cannot move folder: would exceed maximum depth of ${
                MAX_FOLDER_DEPTH + 1
              } levels`
            );
          }

          newParentDepth = newParent.depth;
        }

        // Calculate new depth for this folder
        const newDepth = newParentDepth + 1;

        // ✅ NEW: Check if moving would cause descendants to exceed max depth
        if (newDepth + subtreeDepth > MAX_FOLDER_DEPTH) {
          return createErrorResult(
            `Cannot move folder: it has subfolders that would exceed the maximum depth of ${
              MAX_FOLDER_DEPTH + 1
            } levels`
          );
        }

        updateData.parentId = validated.parentId;
        updateData.depth = newDepth;

        // Validate name for duplicates in new parent
        const nameToCheck = validated.name || existingFolder.name;

        const duplicateError = await validateDuplicateName(
          userId,
          nameToCheck,
          validated.parentId,
          validated.id
        );

        if (duplicateError) {
          return createErrorResult(duplicateError);
        }

        // Update all children depths recursively
        const children = await prisma.folder.findMany({
          where: { parentId: validated.id },
          select: { id: true },
        });

        await Promise.all(
          children.map((child) =>
            updateSubFoldersTreeDepth(child.id, newDepth + 1)
          )
        );
      }
    }

    const folder = await prisma.folder.update({
      where: { id: validated.id },
      data: updateData,
      include: {
        parent: true,
        children: true,
      },
    });

    revalidatePath("/");
    return createSuccessResult(folder, "Folder updated successfully");
  } catch (error) {
    logger.error("Error updating folder:", { error });
    return createErrorResult({ error });
  }
}

async function updateSubFoldersTreeDepth(
  folderId: string,
  newDepth: number
): Promise<void> {
  // Update this folder
  await prisma.folder.update({
    where: { id: folderId },
    data: { depth: newDepth },
  });

  // Get all direct children
  const children = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  });

  // Recursively update children
  await Promise.all(
    children.map((child) => updateSubFoldersTreeDepth(child.id, newDepth + 1))
  );
}

/**
 * Deletes a folder
 * Note: Prisma will cascade delete child folders and set notes' folderId to null
 */
export async function deleteFolder(
  input: DeleteFolderInput
): Promise<ActionResult> {
  try {
    //  Authenticate user
    const userId = await requireAuth();

    // validate input
    const validated = deleteFolderSchema.parse(input);

    const id = validated.id;

    // Verify folder ownership
    const existingFolder = await prisma.folder.findUnique({
      where: { id },
      select: { userId: true, isDefault: true },
    });

    if (!existingFolder) {
      return createErrorResult("Folder not found");
    }

    if (existingFolder.userId !== userId) {
      return createErrorResult("Unauthorized");
    }
    // Prevent deletion of default inbox
    if (existingFolder.isDefault) {
      return createErrorResult("Cannot delete the Inbox folder");
    }

    // Delete folder (cascades to children, notes become loose)
    await prisma.folder.delete({
      where: { id },
    });

    // Revalidate cache
    revalidatePath("/");

    return createSuccessResult("Folder deleted successfully");
  } catch (error) {
    logger.error("Error deleting folder:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Gets all folders for the authenticated user
 * @returns folders with parent, children, and note count
 */

export async function getFolders() {
  try {
    // Authenticate user
    const userId = await requireAuth();

    // Fetch all folders
    const folders = await prisma.folder.findMany({
      where: { userId },
      include: {
        parent: true,
        children: true,
        _count: {
          select: { notes: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return createSuccessResult(folders);
  } catch (error) {
    logger.error("Error fetching folders:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Gets a single folder by ID
 * @returns folder with parent, children, notes, and counts
 */
export async function getFolder(folderId: string) {
  try {
    //  Authenticate user
    const userId = await requireAuth();

    //  Fetch folder
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        parent: true,
        children: true,
        notes: true,
        _count: {
          select: { notes: true, children: true },
        },
      },
    });

    if (!folder) {
      return createErrorResult("Folder not found");
    }

    //  Verify ownership
    if (folder.userId !== userId) {
      return createErrorResult("Unauthorized");
    }

    return createSuccessResult(folder);
  } catch (error) {
    logger.error("Error fetching folder:", { error });
    return createErrorResult({ error });
  }
}

/**
 * Gets root folders (folders without a parent)
 * Used for sidebar navigation and parent selection dropdown
 */
export async function getRootFolders() {
  try {
    // Authenticate user
    const userId = await requireAuth();

    // Fetch root folders
    const folders = await prisma.folder.findMany({
      where: {
        userId,
        parentId: null,
      },
      include: {
        children: true,
        _count: {
          select: { notes: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return createSuccessResult(folders);
  } catch (error) {
    logger.error("Error fetching root folders:", { error });
    return createErrorResult({ error });
  }
}
