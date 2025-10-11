// "use client";

// import { useState, useEffect } from "react";
// import { useModalStore } from "@/stores/modalStore";
// import { FolderColor } from "@prisma/client";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { ColorPicker } from "@/components/common/color-picker";
// import { ConfirmAction } from "@/components/common/confirm-action";
// import { Loader2, Trash2 } from "lucide-react";
// import {
//   useCreateFolder,
//   useUpdateFolder,
//   useDeleteFolder,
// } from "@/hooks/use-folders";
// import type { FolderOption } from "@/types/folderTypes";

// /**
//  * Build hierarchical folder list with proper sorting
//  * Uses the depth field from database (no calculation needed!)
//  */
// function buildHierarchicalFolders(folders: FolderOption[]): FolderOption[] {
//   return [...folders].sort((a, b) => {
//     // Sort by depth first (0, 1, 2)
//     if (a.depth !== b.depth) return a.depth - b.depth;
//     // Then alphabetically within same depth
//     return a.name.localeCompare(b.name);
//   });
// }

// /**
//  * FolderModal Component
//  *
//  * Unified modal for creating and editing folders.
//  *
//  * Features:
//  * - Create mode: New folder with optional parent selection
//  * - Edit mode: Update existing folder (name, parent, color)
//  * - Delete action: Remove folder (from edit mode only)
//  * - Optimistic updates via React Query
//  * - Auto-close on success
//  * - Toast notifications
//  * - Loading states
//  * - Prevents Inbox as parent
//  * - Delete confirmation dialog
//  */
// export function FolderModal() {
//   const { isOpen, type, onClose, data } = useModalStore();
//   const isModalOpen = isOpen && type === "folderModal";
//   const modalData = data.folderModal;

//   // Determine mode from modal data
//   const mode = modalData?.mode || "create";
//   const isEditMode = mode === "edit";

//   // Form state
//   const [name, setName] = useState("");
//   const [parentId, setParentId] = useState<string | null>(null);
//   const [color, setColor] = useState<FolderColor>(FolderColor.GRAY);

//   // Delete confirmation state
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

//   // React Query mutations
//   const createFolderMutation = useCreateFolder();
//   const updateFolderMutation = useUpdateFolder();
//   const deleteFolderMutation = useDeleteFolder();

//   // Get available folders from modal data
//   const availableFolders = modalData?.availableFolders || [];

//   /**
//    * Initialize form with data based on mode
//    */
//   useEffect(() => {
//     if (isModalOpen && modalData) {
//       if (modalData.mode === "create") {
//         // Create mode: Reset form with optional parent pre-selection
//         setName("");
//         setParentId(modalData.parentId ?? null);
//         setColor(FolderColor.GRAY);
//       } else if (modalData.mode === "edit") {
//         // Edit mode: Pre-fill form with folder data
//         setName(modalData.folder.name);
//         setParentId(modalData.folder.parentId);
//         setColor(modalData.folder.color);
//       }
//     }
//   }, [isModalOpen, modalData]);

//   /**
//    * Reset and close modal
//    */
//   const handleClose = () => {
//     // Blur any focused element before closing to prevent aria-hidden warning
//     if (document.activeElement instanceof HTMLElement) {
//       document.activeElement.blur();
//     }
//     setName("");
//     setParentId(null);
//     setColor(FolderColor.GRAY);
//     setShowDeleteConfirm(false); // Reset delete confirm state
//     onClose();
//   };

//   /**
//    * Handle form submission (Create or Update)
//    */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Client-side validation
//     const trimmedName = name.trim();
//     if (!trimmedName) {
//       return; // Hook will show error toast
//     }

//     if (isEditMode && modalData?.mode === "edit") {
//       // Update existing folder
//       updateFolderMutation.mutate(
//         {
//           id: modalData.folder.id,
//           name: trimmedName,
//           parentId,
//           color,
//         },
//         {
//           onSuccess: () => {
//             handleClose(); // Close modal on success
//           },
//         }
//       );
//     } else {
//       // Create new folder
//       createFolderMutation.mutate(
//         {
//           name: trimmedName,
//           parentId,
//           color,
//         },
//         {
//           onSuccess: () => {
//             handleClose(); // Close modal on success
//           },
//         }
//       );
//     }
//   };

//   /**
//    * Open delete confirmation dialog
//    */
//   const handleDeleteClick = () => {
//     setShowDeleteConfirm(true);
//   };

//   /**
//    * Confirm and execute folder deletion
//    */
//   const handleConfirmDelete = () => {
//     if (!isEditMode || modalData?.mode !== "edit") return;

//     deleteFolderMutation.mutate(
//       { id: modalData.folder.id },
//       {
//         onSuccess: () => {
//           handleClose(); // Close modal on success
//         },
//       }
//     );
//   };

//   /**
//    * Get parent folder options with hierarchy
//    * Excludes current folder in edit mode (can't be its own parent)
//    * Excludes Inbox folder (can't be used as parent)
//    */
//   const getParentFolderOptions = () => {
//     let folders = availableFolders;

//     // Filter out Inbox (isDefault folders can't be parents)
//     folders = folders.filter((f) => !f.isDefault);

//     // In edit mode, filter out the current folder
//     if (isEditMode && modalData?.mode === "edit") {
//       folders = folders.filter((folder) => folder.id !== modalData.folder.id);
//     }

//     // Build hierarchical structure with depth
//     return buildHierarchicalFolders(folders);
//   };

//   /**
//    * Render folder option with clear visual hierarchy
//    * Different icons and indentation for each depth level
//    */
//   const renderFolderOption = (folder: FolderOption): string => {
//     switch (folder.depth) {
//       case 0:
//         // Root folders: Just icon and name
//         return `📁 ${folder.name}`;
//       case 1:
//         // First level: Indent + branch connector + different icon
//         return `  ├─ 📂 ${folder.name}`;
//       case 2:
//         // Second level: More indent + end connector + document icon
//         return `    └─ 📄 ${folder.name}`;
//       default:
//         // Fallback (shouldn't happen with max depth 2)
//         return `📁 ${folder.name}`;
//     }
//   };

//   const hierarchicalFolders = getParentFolderOptions();

//   // Determine loading state
//   const isLoading =
//     createFolderMutation.isPending ||
//     updateFolderMutation.isPending ||
//     deleteFolderMutation.isPending;

//   return (
//     <>
//       <Dialog open={isModalOpen} onOpenChange={handleClose}>
//         <DialogContent className="sm:max-w-[500px]">
//           <DialogHeader>
//             <DialogTitle>
//               {isEditMode ? "Edit Folder" : "Create Folder"}
//             </DialogTitle>
//             <DialogDescription>
//               {isEditMode
//                 ? "Update folder details or delete the folder"
//                 : "Create a new folder to organize your notes"}
//             </DialogDescription>
//           </DialogHeader>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Folder Name */}
//             <div className="space-y-2">
//               <Label htmlFor="folder-name">
//                 Folder Name <span className="text-destructive">*</span>
//               </Label>
//               <Input
//                 id="folder-name"
//                 type="text"
//                 value={name}
//                 onChange={(e) => setName(e.target.value)}
//                 placeholder="e.g., CS 101"
//                 disabled={isLoading}
//                 autoFocus
//                 required
//               />
//             </div>

//             {/* Parent Folder */}
//             <div className="space-y-2">
//               <Label htmlFor="parent-folder">Parent Folder (optional)</Label>
//               <Select
//                 value={parentId || "none"}
//                 onValueChange={(value) =>
//                   setParentId(value === "none" ? null : value)
//                 }
//                 disabled={isLoading}
//               >
//                 <SelectTrigger id="parent-folder">
//                   <SelectValue placeholder="None (Root Level)" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="none">None (Root Level)</SelectItem>
//                   {hierarchicalFolders.map((folder) => (
//                     <SelectItem key={folder.id} value={folder.id}>
//                       {renderFolderOption(folder)}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <p className="text-xs text-muted-foreground">
//                 Choose a parent folder to create a subfolder
//               </p>
//             </div>

//             {/* Color Picker */}
//             <div className="space-y-2">
//               <Label>Color</Label>
//               <ColorPicker
//                 value={color}
//                 onChange={setColor}
//                 disabled={isLoading}
//               />
//             </div>

//             <DialogFooter className="gap-2 sm:gap-0">
//               {/* Delete Button (Edit mode only) */}
//               {isEditMode && (
//                 <Button
//                   type="button"
//                   variant="destructive"
//                   onClick={handleDeleteClick}
//                   disabled={isLoading}
//                   className="sm:mr-auto"
//                 >
//                   <Trash2 className="mr-2 h-4 w-4" />
//                   Delete Folder
//                 </Button>
//               )}

//               {/* Cancel Button */}
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={handleClose}
//                 disabled={isLoading}
//               >
//                 Cancel
//               </Button>

//               {/* Submit Button */}
//               <Button type="submit" disabled={isLoading}>
//                 {createFolderMutation.isPending ||
//                 updateFolderMutation.isPending ? (
//                   <>
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                     {isEditMode ? "Saving..." : "Creating..."}
//                   </>
//                 ) : (
//                   <>{isEditMode ? "Save Changes" : "Create Folder"}</>
//                 )}
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       {/* Delete Confirmation Dialog */}
//       {isEditMode && modalData?.mode === "edit" && (
//         <ConfirmAction
//           open={showDeleteConfirm}
//           onOpenChange={setShowDeleteConfirm}
//           title={`Delete "${modalData.folder.name}"?`}
//           description={`This will permanently delete the folder "${modalData.folder.name}" and all its subfolders.\n\nNotes inside will become unorganized.`}
//           confirmText="Delete Folder"
//           cancelText="Cancel"
//           variant="destructive"
//           loading={deleteFolderMutation.isPending}
//           onConfirm={handleConfirmDelete}
//         />
//       )}
//     </>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import { useModalStore } from "@/stores/modalStore";
import { FolderColor } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/common/color-picker";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Loader2, Trash2 } from "lucide-react";
import {
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
} from "@/hooks/use-folders";
import { FolderSelector } from "../common/folder-selector";

/**
 * FolderModal Component
 *
 * Unified modal for creating and editing folders.
 *
 * Features:
 * - Create mode: New folder with optional parent selection
 * - Edit mode: Update existing folder (name, parent, color)
 * - Delete action: Remove folder (from edit mode only)
 * - Optimistic updates via React Query
 * - Auto-close on success
 * - Toast notifications
 * - Loading states
 * - Prevents Inbox as parent
 * - Delete confirmation dialog
 */
export function FolderModal() {
  const { isOpen, type, onClose, data } = useModalStore();
  const isModalOpen = isOpen && type === "folderModal";
  const modalData = data.folderModal;

  // Determine mode from modal data
  const mode = modalData?.mode || "create";
  const isEditMode = mode === "edit";

  // Form state
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [color, setColor] = useState<FolderColor>(FolderColor.GRAY);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // React Query mutations
  const createFolderMutation = useCreateFolder();
  const updateFolderMutation = useUpdateFolder();
  const deleteFolderMutation = useDeleteFolder();

  /**
   * Initialize form with data based on mode
   */
  useEffect(() => {
    if (isModalOpen && modalData) {
      if (modalData.mode === "create") {
        // Create mode: Reset form with optional parent pre-selection
        setName("");
        setParentId(modalData.parentId ?? null);
        setColor(FolderColor.GRAY);
      } else if (modalData.mode === "edit") {
        // Edit mode: Pre-fill form with folder data
        setName(modalData.folder.name);
        setParentId(modalData.folder.parentId);
        setColor(modalData.folder.color);
      }
    }
  }, [isModalOpen, modalData]);

  /**
   * Reset and close modal
   */
  const handleClose = () => {
    // Blur any focused element before closing to prevent aria-hidden warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setName("");
    setParentId(null);
    setColor(FolderColor.GRAY);
    setShowDeleteConfirm(false); // Reset delete confirm state
    onClose();
  };

  /**
   * Handle form submission (Create or Update)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      return; // Hook will show error toast
    }

    if (isEditMode && modalData?.mode === "edit") {
      // Update existing folder
      updateFolderMutation.mutate(
        {
          id: modalData.folder.id,
          name: trimmedName,
          parentId,
          color,
        },
        {
          onSuccess: () => {
            handleClose(); // Close modal on success
          },
        }
      );
    } else {
      // Create new folder
      createFolderMutation.mutate(
        {
          name: trimmedName,
          parentId,
          color,
        },
        {
          onSuccess: () => {
            handleClose(); // Close modal on success
          },
        }
      );
    }
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * Confirm and execute folder deletion
   */
  const handleConfirmDelete = () => {
    if (!isEditMode || modalData?.mode !== "edit") return;

    deleteFolderMutation.mutate(
      { id: modalData.folder.id },
      {
        onSuccess: () => {
          handleClose(); // Close modal on success
        },
      }
    );
  };

  // Determine loading state
  const isLoading =
    createFolderMutation.isPending ||
    updateFolderMutation.isPending ||
    deleteFolderMutation.isPending;

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Folder" : "Create Folder"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Update folder details or delete the folder"
                : "Create a new folder to organize your notes"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Folder Name */}
            <div className="space-y-2">
              <Label htmlFor="folder-name">
                Folder Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="folder-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., CS 101"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>

            {/* Parent Folder */}
            <FolderSelector
              value={parentId}
              onChange={setParentId}
              excludeFolderIds={
                isEditMode && modalData?.mode === "edit"
                  ? [modalData.folder.id]
                  : []
              }
              excludeInbox={true}
              placeholder="None (Root Level)"
              label="Parent Folder (optional)"
              helperText="Choose a parent folder to create a subfolder"
              showNoneOption={true}
              disabled={isLoading}
            />

            {/* Color Picker */}
            <div className="space-y-2">
              <Label>Color</Label>
              <ColorPicker
                value={color}
                onChange={setColor}
                disabled={isLoading}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {/* Delete Button (Edit mode only) */}
              {isEditMode && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDeleteClick}
                  disabled={isLoading}
                  className="sm:mr-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Folder
                </Button>
              )}

              {/* Cancel Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading}>
                {createFolderMutation.isPending ||
                updateFolderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? "Saving..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditMode ? "Save Changes" : "Create Folder"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {isEditMode && modalData?.mode === "edit" && (
        <ConfirmAction
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={`Delete "${modalData.folder.name}"?`}
          description={`This will permanently delete the folder "${modalData.folder.name}" and all its subfolders.\n\nNotes inside will become unorganized.`}
          confirmText="Delete Folder"
          cancelText="Cancel"
          variant="destructive"
          loading={deleteFolderMutation.isPending}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
}
