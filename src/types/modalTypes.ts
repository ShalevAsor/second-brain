import { FolderColor } from "@prisma/client";
import { FolderOption } from "./folderTypes";
/**
 * Modal Types Definition
 * Defines all data structures that can be passed to modals
 */

/**
 * Quick Capture Modal Data
 * Supports pre-filling content from various sources:
 * - Browser extensions
 * - URL parameters
 * - Internal app actions (extract from note)
 * - Templates
 */
export interface QuickCaptureModalData {
  initialContent?: string;
  suggestedFolder?: string;
  suggestedTags?: string[];
}

/**
 * Folder Modal Data
 * Supports both Create and Edit modes with a discriminated union
 * for type-safe mode handling
 */
export type FolderModalData =
  | {
      mode: "create";
      parentId?: string | null; // Optional: Pre-select parent folder
      availableFolders: FolderOption[];
    }
  | {
      mode: "edit";
      folder: {
        id: string;
        name: string;
        parentId: string | null;
        color: FolderColor;
      };
      availableFolders: FolderOption[];
    };

/**
 * Modal Data Interface
 * Defines the structure of additional data that can be passed to modals.
 * Allows modals to be context-aware and display relevant information.
 */
export type ModalData = {
  quickCapture?: QuickCaptureModalData;
  folderModal?: FolderModalData;
};
