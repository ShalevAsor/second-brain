// "use client";

// import { Folder, Plus } from "lucide-react";
// import { SidebarSection } from "@/components/sidebar/shared/sidebar-section";
// import { FolderTree } from "@/components/sidebar/folders/folder-tree";
// import { SidebarMenu } from "@/components/ui/sidebar";
// import { Skeleton } from "@/components/ui/skeleton";
// import { useModalStore } from "@/stores/modalStore";
// import { useSidebarUIStore } from "@/stores/sidebarUIStore";
// import { useFolders } from "@/hooks/use-folders";
// import type { FolderTreeData } from "@/types/folderTypes";
// import { Button } from "../../ui/button";

// /**
//  * Folders Navigation Component
//  *
//  * Displays hierarchical folder structure in the sidebar.
//  *
//  * Features:
//  * - Real-time data from React Query (useFolders)
//  * - Inbox folder always displayed first
//  * - [+] button to create new folders
//  * - Loading state with skeletons
//  * - Empty state
//  * - Automatic refresh after create/update/delete (via React Query)
//  *
//  * State Management:
//  * - Folder data: React Query (useFolders)
//  * - Section open/closed: Zustand (useSidebarUIStore)
//  * - Modal: Zustand (useModalStore)
//  */
// export function NavFolders() {
//   const { onOpen } = useModalStore();
//   const { sections, toggleSection } = useSidebarUIStore();

//   // Fetch folders with React Query
//   const { data: folders = [], isLoading } = useFolders();

//   /**
//    * Handle add folder button click
//    * Opens modal in create mode with available folders for parent selection
//    */
//   const handleAddFolder = (e: React.MouseEvent) => {
//     e.stopPropagation(); // Prevent section collapse

//     // Prepare folder options for parent dropdown (include depth!)
//     const availableFolders = folders.map((f) => ({
//       id: f.id,
//       name: f.name,
//       parentId: f.parentId,
//       isDefault: f.isDefault,
//       depth: f.depth, // ✅ Include depth from database
//     }));

//     // Open modal in create mode
//     onOpen("folderModal", {
//       folderModal: {
//         mode: "create",
//         availableFolders,
//       },
//     });
//   };

//   /**
//    * Convert database folder to tree data format
//    */
//   const convertToTreeData = (folder: (typeof folders)[0]): FolderTreeData => ({
//     id: folder.id,
//     name: folder.name,
//     noteCount: folder._count.notes,
//     parentId: folder.parentId,
//     color: folder.color,
//     isDefault: folder.isDefault,
//     children: [],
//   });

//   /**
//    * Build folder hierarchy recursively
//    * Converts flat array of folders into nested tree structure
//    */
//   const buildFolderTree = (parentId: string | null): FolderTreeData[] => {
//     return folders
//       .filter((f) => f.parentId === parentId && !f.isDefault)
//       .map((folder) => {
//         const treeData = convertToTreeData(folder);
//         treeData.children = buildFolderTree(folder.id);
//         return treeData;
//       });
//   };

//   // Get inbox folder (isDefault = true)
//   const inboxFolder = folders.find((f) => f.isDefault);

//   // Get hierarchical folder tree
//   const folderTree = buildFolderTree(null);

//   // Prepare folder options for FolderTree component (include depth!)
//   const folderOptions = folders.map((f) => ({
//     id: f.id,
//     name: f.name,
//     parentId: f.parentId,
//     isDefault: f.isDefault,
//     depth: f.depth, // ✅ Include depth from database
//   }));

//   return (
//     <SidebarSection
//       title="Folders"
//       icon={Folder}
//       count={folders.length}
//       isOpen={sections.folders}
//       onToggle={() => toggleSection("folders")}
//       actions={
//         <Button
//           onClick={handleAddFolder}
//           className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-sidebar-accent transition-colors"
//           aria-label="Add folder"
//         >
//           <Plus className="h-4 w-4" />
//         </Button>
//       }
//     >
//       <SidebarMenu>
//         {isLoading ? (
//           // Loading skeletons
//           <>
//             <div className="px-2 py-1.5">
//               <Skeleton className="h-8 w-full" />
//             </div>
//             <div className="px-2 py-1.5">
//               <Skeleton className="h-8 w-full" />
//             </div>
//             <div className="px-2 py-1.5">
//               <Skeleton className="h-8 w-full" />
//             </div>
//           </>
//         ) : (
//           <>
//             {/* Inbox - Always first */}
//             {inboxFolder && (
//               <FolderTree
//                 folder={convertToTreeData(inboxFolder)}
//                 allFolders={folderOptions}
//               />
//             )}

//             {/* Regular folders (hierarchical) */}
//             {folderTree.map((folder) => (
//               <FolderTree
//                 key={folder.id}
//                 folder={folder}
//                 allFolders={folderOptions}
//               />
//             ))}

//             {/* Empty state */}
//             {folders.length === 0 && (
//               <div className="px-2 py-4 text-sm text-muted-foreground">
//                 No folders yet. Click + to create one.
//               </div>
//             )}
//           </>
//         )}
//       </SidebarMenu>
//     </SidebarSection>
//   );
// }
"use client";

import { Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarMenu } from "@/components/ui/sidebar";
import { SidebarSection } from "@/components/sidebar/shared";
import { SidebarLoading, SidebarEmptyState } from "@/components/sidebar/shared";
import { FolderTree } from "./folder-tree";
import { useModalStore } from "@/stores/modalStore";
import { useSidebarUIStore } from "@/stores/sidebarUIStore";
import { useFolders } from "@/hooks/use-folders";
import type { FolderTreeData } from "@/types/folderTypes";

/**
 * Folders Navigation Component
 *
 * Displays hierarchical folder structure in the sidebar.
 *
 * Features:
 * - Real-time data from React Query (useFolders)
 * - Inbox folder always displayed first
 * - [+] button to create new folders
 * - Loading and empty states
 * - Automatic refresh after CRUD operations
 *
 * State Management:
 * - Folder data: React Query (useFolders)
 * - Section open/closed: Zustand (useSidebarUIStore)
 * - Modal: Zustand (useModalStore)
 */
export function NavFolders() {
  const { onOpen } = useModalStore();
  const { sections, toggleSection } = useSidebarUIStore();
  const { data: folders = [], isLoading } = useFolders();

  /**
   * Handle add folder button click
   * Opens modal in create mode with available folders for parent selection
   */
  const handleAddFolder = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent section collapse

    const availableFolders = folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      isDefault: f.isDefault,
      depth: f.depth,
    }));

    onOpen("folderModal", {
      folderModal: {
        mode: "create",
        availableFolders,
      },
    });
  };

  // Convert database folder to tree data format
  const convertToTreeData = (folder: (typeof folders)[0]): FolderTreeData => ({
    id: folder.id,
    name: folder.name,
    noteCount: folder._count.notes,
    parentId: folder.parentId,
    color: folder.color,
    isDefault: folder.isDefault,
    children: [],
  });

  // Build folder hierarchy recursively
  const buildFolderTree = (parentId: string | null): FolderTreeData[] => {
    return folders
      .filter((f) => f.parentId === parentId && !f.isDefault)
      .map((folder) => {
        const treeData = convertToTreeData(folder);
        treeData.children = buildFolderTree(folder.id);
        return treeData;
      });
  };

  const inboxFolder = folders.find((f) => f.isDefault);
  const folderTree = buildFolderTree(null);
  const folderOptions = folders.map((f) => ({
    id: f.id,
    name: f.name,
    parentId: f.parentId,
    isDefault: f.isDefault,
    depth: f.depth,
  }));

  return (
    <SidebarSection
      title="Folders"
      icon={Folder}
      count={folders.length}
      isOpen={sections.folders}
      onToggle={() => toggleSection("folders")}
      actions={
        <Button
          onClick={handleAddFolder}
          className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label="Add folder"
        >
          <Plus className="h-4 w-4" />
        </Button>
      }
    >
      <SidebarMenu>
        {/* Loading state */}
        {isLoading && <SidebarLoading count={3} />}

        {/* Empty state */}
        {!isLoading && folders.length === 0 && (
          <SidebarEmptyState message="No folders yet. Click + to create one." />
        )}

        {/* Folders list */}
        {!isLoading && folders.length > 0 && (
          <>
            {/* Inbox - Always first */}
            {inboxFolder && (
              <FolderTree
                folder={convertToTreeData(inboxFolder)}
                allFolders={folderOptions}
              />
            )}

            {/* Regular folders (hierarchical) */}
            {folderTree.map((folder) => (
              <FolderTree
                key={folder.id}
                folder={folder}
                allFolders={folderOptions}
              />
            ))}
          </>
        )}
      </SidebarMenu>
    </SidebarSection>
  );
}
