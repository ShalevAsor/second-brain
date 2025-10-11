// "use client";

// import { useState } from "react";
// import {
//   ChevronRight,
//   Folder,
//   Inbox,
//   MoreVertical,
//   Pencil,
//   Trash2,
// } from "lucide-react";
// import Link from "next/link";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import {
//   SidebarMenuItem,
//   SidebarMenuButton,
//   SidebarMenuSub,
//   SidebarMenuAction,
// } from "@/components/ui/sidebar";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { cn } from "@/lib/utils";
// import { getFolderColorClass } from "@/components/common/color-picker";
// import { useModalStore } from "@/stores/modalStore";
// import { useFolderStore } from "@/stores/folderStore";
// import { useDeleteFolder } from "@/hooks/use-folders";
// import { ConfirmAction } from "@/components/common/confirm-action";
// import type { FolderTreeData, FolderOption } from "@/types/folderTypes";

// interface FolderTreeProps {
//   folder: FolderTreeData;
//   allFolders: FolderOption[]; // For modal parent dropdown
//   depth?: number;
//   maxDepth?: number;
// }

// /**
//  * Recursive Folder Tree Component
//  *
//  * Renders a folder and its children up to maxDepth levels.
//  *
//  * Features:
//  * - Hierarchical display (max 3 levels)
//  * - Colored folder icons
//  * - Click folder name to navigate
//  * - Click chevron to expand/collapse
//  * - Context menu [⋮] with Edit/Delete
//  * - Special styling for Inbox (no context menu)
//  * - Selection state from Zustand
//  * - Expansion state from Zustand
//  * - Confirmation dialog for delete action
//  */
// export function FolderTree({
//   folder,
//   allFolders,
//   depth = 0,
//   maxDepth = 3,
// }: FolderTreeProps) {
//   const { onOpen } = useModalStore();
//   const {
//     selectedFolderId,
//     setSelectedFolder,
//     expandedFolderIds,
//     toggleExpanded,
//   } = useFolderStore();
//   const deleteFolderMutation = useDeleteFolder();

//   // Local state for delete confirmation
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

//   const hasChildren = folder.children && folder.children.length > 0;
//   const canExpand = depth < maxDepth && hasChildren;
//   const isExpanded = expandedFolderIds.has(folder.id);
//   const isSelected = selectedFolderId === folder.id;

//   /**
//    * Handle folder click (navigation)
//    */
//   const handleFolderClick = () => {
//     setSelectedFolder(folder.id);
//   };

//   /**
//    * Handle chevron click (expand/collapse)
//    */
//   const handleToggleExpand = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     toggleExpanded(folder.id);
//   };

//   /**
//    * Open edit modal for this folder
//    */
//   const handleEdit = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();

//     onOpen("folderModal", {
//       folderModal: {
//         mode: "edit",
//         folder: {
//           id: folder.id,
//           name: folder.name,
//           parentId: folder.parentId,
//           color: folder.color,
//         },
//         availableFolders: allFolders,
//       },
//     });
//   };

//   /**
//    * Open delete confirmation dialog
//    */
//   const handleDeleteClick = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setShowDeleteConfirm(true);
//   };

//   /**
//    * Confirm deletion and execute
//    */
//   const handleConfirmDelete = () => {
//     deleteFolderMutation.mutate({ id: folder.id });
//   };

//   /**
//    * Context Menu Component
//    * Shows Edit and Delete options (not for Inbox)
//    */
//   const ContextMenu = () => {
//     // Don't show context menu for Inbox
//     if (folder.isDefault) return null;

//     return (
//       <DropdownMenu>
//         <DropdownMenuTrigger asChild>
//           <SidebarMenuAction
//             className="data-[state=open]:opacity-100"
//             showOnHover
//           >
//             <MoreVertical className="h-4 w-4" />
//             <span className="sr-only">Folder options</span>
//           </SidebarMenuAction>
//         </DropdownMenuTrigger>
//         <DropdownMenuContent side="right" align="start" className="w-48">
//           <DropdownMenuItem onClick={handleEdit}>
//             <Pencil className="mr-2 h-4 w-4" />
//             Edit Folder
//           </DropdownMenuItem>
//           <DropdownMenuSeparator />
//           <DropdownMenuItem
//             onClick={handleDeleteClick}
//             className="text-destructive focus:text-destructive"
//             disabled={deleteFolderMutation.isPending}
//           >
//             <Trash2 className="mr-2 h-4 w-4" />
//             Delete Folder
//           </DropdownMenuItem>
//         </DropdownMenuContent>
//       </DropdownMenu>
//     );
//   };

//   /**
//    * Render: Inbox Folder (Special Case)
//    */
//   if (folder.isDefault) {
//     return (
//       <SidebarMenuItem>
//         <SidebarMenuButton
//           asChild
//           isActive={isSelected}
//           className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 data-[active=true]:bg-blue-500/20"
//         >
//           <Link href={`/folders/${folder.id}`} onClick={handleFolderClick}>
//             <Inbox className="h-4 w-4" />
//             <span className="font-medium">{folder.name}</span>
//             {folder.noteCount > 0 && (
//               <span className="ml-auto text-xs">{folder.noteCount}</span>
//             )}
//           </Link>
//         </SidebarMenuButton>
//       </SidebarMenuItem>
//     );
//   }

//   /**
//    * Render: Leaf Folder (No Children or Max Depth)
//    */
//   if (!canExpand) {
//     return (
//       <>
//         <SidebarMenuItem>
//           <SidebarMenuButton asChild isActive={isSelected}>
//             <Link href={`/folders/${folder.id}`} onClick={handleFolderClick}>
//               <Folder
//                 className={cn("h-4 w-4", getFolderColorClass(folder.color))}
//               />
//               <span>{folder.name}</span>
//               {folder.noteCount > 0 && (
//                 <span className="ml-auto text-xs text-muted-foreground">
//                   {folder.noteCount}
//                 </span>
//               )}
//             </Link>
//           </SidebarMenuButton>
//           <ContextMenu />
//         </SidebarMenuItem>

//         {/* Delete Confirmation Dialog */}
//         <ConfirmAction
//           open={showDeleteConfirm}
//           onOpenChange={setShowDeleteConfirm}
//           title={`Delete "${folder.name}"?`}
//           description={`This will permanently delete the folder "${folder.name}" and all its subfolders.\n\nNotes inside will become unorganized.`}
//           confirmText="Delete Folder"
//           cancelText="Cancel"
//           variant="destructive"
//           loading={deleteFolderMutation.isPending}
//           onConfirm={handleConfirmDelete}
//         />
//       </>
//     );
//   }

//   /**
//    * Render: Parent Folder (Has Children)
//    */
//   return (
//     <>
//       <SidebarMenuItem>
//         <Collapsible
//           open={isExpanded}
//           onOpenChange={() => toggleExpanded(folder.id)}
//         >
//           {/* Folder Item */}
//           <div className="relative flex items-center">
//             {/* Chevron Button (Expand/Collapse) */}
//             <CollapsibleTrigger asChild>
//               <button
//                 onClick={handleToggleExpand}
//                 className="absolute left-1 p-1 hover:bg-sidebar-accent rounded-sm transition-colors z-10"
//                 aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
//               >
//                 <ChevronRight
//                   className={cn(
//                     "h-4 w-4 transition-transform duration-200",
//                     isExpanded && "rotate-90"
//                   )}
//                 />
//               </button>
//             </CollapsibleTrigger>

//             {/* Folder Link (Clickable) */}
//             <SidebarMenuButton asChild isActive={isSelected} className="pl-7">
//               <Link href={`/folders/${folder.id}`} onClick={handleFolderClick}>
//                 <Folder
//                   className={cn("h-4 w-4", getFolderColorClass(folder.color))}
//                 />
//                 <span>{folder.name}</span>
//                 {folder.noteCount > 0 && (
//                   <span className="ml-auto text-xs text-muted-foreground">
//                     {folder.noteCount}
//                   </span>
//                 )}
//               </Link>
//             </SidebarMenuButton>

//             {/* Context Menu */}
//             <ContextMenu />
//           </div>

//           {/* Children */}
//           <CollapsibleContent>
//             <SidebarMenuSub>
//               {folder.children?.map((child) => (
//                 <FolderTree
//                   key={child.id}
//                   folder={child}
//                   allFolders={allFolders}
//                   depth={depth + 1}
//                   maxDepth={maxDepth}
//                 />
//               ))}
//             </SidebarMenuSub>
//           </CollapsibleContent>
//         </Collapsible>
//       </SidebarMenuItem>

//       {/* Delete Confirmation Dialog */}
//       <ConfirmAction
//         open={showDeleteConfirm}
//         onOpenChange={setShowDeleteConfirm}
//         title={`Delete "${folder.name}"?`}
//         description={`This will permanently delete the folder "${folder.name}" and all its subfolders.\n\nNotes inside will become unorganized.`}
//         confirmText="Delete Folder"
//         cancelText="Cancel"
//         variant="destructive"
//         loading={deleteFolderMutation.isPending}
//         onConfirm={handleConfirmDelete}
//       />
//     </>
//   );
// }
// src/components/sidebar/folders/folder-tree.tsx
"use client";

import { useState } from "react";
import {
  ChevronRight,
  Folder,
  Inbox,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getFolderColorClass } from "@/components/common/color-picker";
import { useModalStore } from "@/stores/modalStore";
import { useFolderStore } from "@/stores/folderStore";
import { useDeleteFolder } from "@/hooks/use-folders";
import { ConfirmAction } from "@/components/common/confirm-action";
import type { FolderTreeData, FolderOption } from "@/types/folderTypes";

interface FolderTreeProps {
  folder: FolderTreeData;
  allFolders: FolderOption[]; // For modal parent dropdown
  depth?: number;
  maxDepth?: number;
}

/**
 * Recursive Folder Tree Component
 *
 * Renders a folder and its children up to maxDepth levels.
 *
 * Features:
 * - Hierarchical display (max 3 levels)
 * - Colored folder icons
 * - Click folder name to navigate to /notes?folder=xyz
 * - Click chevron to expand/collapse
 * - Context menu [⋮] with Edit/Delete
 * - Special styling for Inbox (no context menu)
 * - Expansion state from Zustand
 * - Active state based on query params
 * - Confirmation dialog for delete action
 */
export function FolderTree({
  folder,
  allFolders,
  depth = 0,
  maxDepth = 3,
}: FolderTreeProps) {
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get("folder");

  const { onOpen } = useModalStore();
  const { expandedFolderIds, toggleExpanded } = useFolderStore();
  const deleteFolderMutation = useDeleteFolder();

  // Local state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasChildren = folder.children && folder.children.length > 0;
  const canExpand = depth < maxDepth && hasChildren;
  const isExpanded = expandedFolderIds.has(folder.id);
  const isActive = currentFolderId === folder.id;

  /**
   * Handle chevron click (expand/collapse)
   */
  const handleToggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleExpanded(folder.id);
  };

  /**
   * Open edit modal for this folder
   */
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onOpen("folderModal", {
      folderModal: {
        mode: "edit",
        folder: {
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
          color: folder.color,
        },
        availableFolders: allFolders,
      },
    });
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  /**
   * Confirm deletion and execute
   */
  const handleConfirmDelete = () => {
    deleteFolderMutation.mutate({ id: folder.id });
  };

  /**
   * Context Menu Component
   * Shows Edit and Delete options (not for Inbox)
   */
  const ContextMenu = () => {
    // Don't show context menu for Inbox
    if (folder.isDefault) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:opacity-100"
            showOnHover
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Folder options</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-48">
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Folder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDeleteClick}
            className="text-destructive focus:text-destructive"
            disabled={deleteFolderMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  /**
   * Render: Inbox Folder (Special Case)
   */
  if (folder.isDefault) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 data-[active=true]:bg-blue-500/20"
        >
          <Link href={`/notes?folder=${folder.id}`}>
            <Inbox className="h-4 w-4" />
            <span className="font-medium">{folder.name}</span>
            {folder.noteCount > 0 && (
              <span className="ml-auto text-xs">{folder.noteCount}</span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  /**
   * Render: Leaf Folder (No Children or Max Depth)
   */
  if (!canExpand) {
    return (
      <>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={isActive}>
            <Link href={`/notes?folder=${folder.id}`}>
              <Folder
                className={cn("h-4 w-4", getFolderColorClass(folder.color))}
              />
              <span>{folder.name}</span>
              {folder.noteCount > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {folder.noteCount}
                </span>
              )}
            </Link>
          </SidebarMenuButton>
          <ContextMenu />
        </SidebarMenuItem>

        {/* Delete Confirmation Dialog */}
        <ConfirmAction
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={`Delete "${folder.name}"?`}
          description={`This will permanently delete the folder "${folder.name}" and all its subfolders.\n\nNotes inside will become unorganized.`}
          confirmText="Delete Folder"
          cancelText="Cancel"
          variant="destructive"
          loading={deleteFolderMutation.isPending}
          onConfirm={handleConfirmDelete}
        />
      </>
    );
  }

  /**
   * Render: Parent Folder (Has Children)
   */
  return (
    <>
      <SidebarMenuItem>
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleExpanded(folder.id)}
        >
          {/* Folder Item */}
          <div className="relative flex items-center">
            {/* Chevron Button (Expand/Collapse) */}
            <CollapsibleTrigger asChild>
              <button
                onClick={handleToggleExpand}
                className="absolute left-1 p-1 hover:bg-sidebar-accent rounded-sm transition-colors z-10"
                aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isExpanded && "rotate-90"
                  )}
                />
              </button>
            </CollapsibleTrigger>

            {/* Folder Link (Clickable) */}
            <SidebarMenuButton asChild isActive={isActive} className="pl-7">
              <Link href={`/notes?folder=${folder.id}`}>
                <Folder
                  className={cn("h-4 w-4", getFolderColorClass(folder.color))}
                />
                <span>{folder.name}</span>
                {folder.noteCount > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {folder.noteCount}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>

            {/* Context Menu */}
            <ContextMenu />
          </div>

          {/* Children */}
          <CollapsibleContent>
            <SidebarMenuSub>
              {folder.children?.map((child) => (
                <FolderTree
                  key={child.id}
                  folder={child}
                  allFolders={allFolders}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>

      {/* Delete Confirmation Dialog */}
      <ConfirmAction
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={`Delete "${folder.name}"?`}
        description={`This will permanently delete the folder "${folder.name}" and all its subfolders.\n\nNotes inside will become unorganized.`}
        confirmText="Delete Folder"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteFolderMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
