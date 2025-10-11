// // src/components/editor/note-metadata.tsx
// "use client";

// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Star, Trash2 } from "lucide-react";
// import { TagInput } from "@/components/common/tag-input";
// import { FolderSelector } from "@/components/common/folder-selector";
// import {
//   AutoSaveIndicator,
//   SaveStatus,
// } from "@/components/common/auto-save-indicator";
// import { SimpleTag } from "@/types/noteTypes";

// /**
//  * Note Metadata Component
//  *
//  * Displays and manages note metadata (folder, tags) and actions (save, favorite, delete).
//  * Used in both create and edit note pages.
//  *
//  * Layout:
//  * - Folder selector
//  * - Tag input
//  * - Actions row (auto-save indicator + buttons)
//  */
// interface NoteMetadataProps {
//   // Form state
//   folderId: string | null;
//   onFolderChange: (folderId: string | null) => void;
//   selectedTags: SimpleTag[];
//   onTagAdd: (tag: SimpleTag) => Promise<void>;
//   onTagRemove: (tagId: string) => Promise<void>;

//   // Save state
//   saveStatus: SaveStatus;
//   lastSaved?: Date;
//   onManualSave: () => Promise<void>;

//   // Mode-specific actions (edit only)
//   mode: "create" | "edit";
//   isFavorite?: boolean;
//   onToggleFavorite?: () => Promise<void>;
//   onDelete?: () => void;

//   // UI state
//   isDeleting?: boolean;
//   isTogglingFavorite?: boolean;
// }

// export function NoteMetadata({
//   // Form
//   folderId,
//   onFolderChange,
//   selectedTags,
//   onTagAdd,
//   onTagRemove,

//   // Save
//   saveStatus,
//   lastSaved,
//   onManualSave,

//   // Mode-specific
//   mode,
//   isFavorite = false,
//   onToggleFavorite,
//   onDelete,

//   // UI state
//   isDeleting = false,
//   isTogglingFavorite = false,
// }: NoteMetadataProps) {
//   return (
//     <div className="space-y-6 rounded-lg border bg-card p-6">
//       {/* Folder Selector */}
//       <FolderSelector
//         value={folderId}
//         onChange={onFolderChange}
//         label="Folder"
//         placeholder="Select folder..."
//         helperText="Organize your note by selecting a folder"
//         showNoneOption={true}
//         noneOptionLabel="📥 Inbox (default)"
//       />

//       {/* Tag Input */}
//       <div>
//         <Label className="mb-2 block">Tags</Label>
//         <TagInput
//           selectedTags={selectedTags}
//           onTagAdd={onTagAdd}
//           onTagRemove={onTagRemove}
//           placeholder="Add tags..."
//         />
//       </div>

//       {/* Actions Row */}
//       <div className="flex items-center justify-between gap-4 border-t pt-4">
//         {/* Left: Auto-save indicator */}
//         <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />

//         {/* Right: Action buttons */}
//         <div className="flex items-center gap-2">
//           {/* Edit mode only: Favorite + Delete */}
//           {mode === "edit" && (
//             <>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={onToggleFavorite}
//                 disabled={isTogglingFavorite}
//                 title={
//                   isFavorite ? "Remove from favorites" : "Add to favorites"
//                 }
//               >
//                 <Star
//                   className={`h-4 w-4 ${
//                     isFavorite ? "fill-yellow-400 text-yellow-400" : ""
//                   }`}
//                 />
//               </Button>

//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={onDelete}
//                 disabled={isDeleting}
//                 title="Delete note"
//               >
//                 <Trash2 className="h-4 w-4 text-destructive" />
//               </Button>
//             </>
//           )}

//           {/* Save button (both modes) */}
//           <Button
//             variant="default"
//             size="sm"
//             onClick={onManualSave}
//             disabled={saveStatus === "saving"}
//           >
//             {saveStatus === "saving" ? "Saving..." : "Save"}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
// src/components/editor/note-metadata.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Save, Star, Trash2 } from "lucide-react";
import { TagInput } from "@/components/common/tag-input";
import { FolderSelector } from "@/components/common/folder-selector";
import {
  AutoSaveIndicator,
  SaveStatus,
} from "@/components/common/auto-save-indicator";
import { SimpleTag } from "@/types/noteTypes";

/**
 * Note Metadata Component
 *
 * Displays and manages note metadata (folder, tags) and actions (save, favorite, delete).
 * Used in both create and edit note pages.
 *
 * Layout:
 * - Folder selector
 * - Tag input
 * - Actions row (auto-save indicator + buttons)
 */
interface NoteMetadataProps {
  // Form state
  folderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  selectedTags: SimpleTag[];
  onTagAdd: (tag: SimpleTag) => Promise<void>;
  onTagRemove: (tagId: string) => Promise<void>;

  // Save state
  saveStatus: SaveStatus;
  lastSaved?: Date;
  onManualSave: () => Promise<void>;

  // Mode-specific actions (edit only)
  mode: "create" | "edit";
  isFavorite?: boolean;
  onToggleFavorite?: () => Promise<void>;
  onDelete?: () => void;

  // UI state
  isDeleting?: boolean;
  isTogglingFavorite?: boolean;
}

export function NoteMetadata({
  // Form
  folderId,
  onFolderChange,
  selectedTags,
  onTagAdd,
  onTagRemove,

  // Save
  saveStatus,
  lastSaved,
  onManualSave,

  // Mode-specific
  mode,
  isFavorite = false,
  onToggleFavorite,
  onDelete,

  // UI state
  isDeleting = false,
  isTogglingFavorite = false,
}: NoteMetadataProps) {
  return (
    <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-3 sm:flex-row sm:items-center">
      {/* Folder */}
      <div className="min-w-[180px]">
        <FolderSelector
          value={folderId}
          onChange={onFolderChange}
          placeholder="📁 Folder"
          showNoneOption={true}
          noneOptionLabel="📥 Inbox"
        />
      </div>
      <div className="h-6 w-px bg-border" /> {/* Vertical separator */}
      {/* Tags */}
      <div className="flex-1">
        <TagInput
          selectedTags={selectedTags}
          onTagAdd={onTagAdd}
          onTagRemove={onTagRemove}
          placeholder="🏷️ Tags..."
        />
      </div>
      <div className="h-6 w-px bg-border" /> {/* Vertical separator */}
      {/* Auto-save indicator */}
      <AutoSaveIndicator status={saveStatus} lastSaved={lastSaved} />
      <div className="h-6 w-px bg-border" /> {/* Vertical separator */}
      {/* Actions */}
      <div className="flex items-center gap-1">
        {mode === "edit" && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              disabled={isTogglingFavorite}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="h-8 w-8"
            >
              <Star
                className={`h-4 w-4 ${
                  isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                }`}
              />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
              title="Delete note"
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </>
        )}

        <Button
          variant="default"
          size="sm"
          onClick={onManualSave}
          disabled={saveStatus === "saving"}
          className="h-8"
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          {saveStatus === "saving" ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
