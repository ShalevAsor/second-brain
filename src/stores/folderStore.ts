// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// /**
//  * Folder UI State
//  * Manages folder-specific UI state (selection, expansion, etc.)
//  */
// interface FolderState {
//   /**
//    * Currently selected folder ID
//    * Used to highlight the active folder in sidebar
//    */
//   selectedFolderId: string | null;

//   /**
//    * Set of expanded folder IDs
//    * Tracks which folders are showing their children
//    */
//   expandedFolderIds: Set<string>;

//   /**
//    * Actions
//    */
//   setSelectedFolder: (folderId: string | null) => void;
//   toggleExpanded: (folderId: string) => void;
//   expandFolder: (folderId: string) => void;
//   collapseFolder: (folderId: string) => void;
//   collapseAll: () => void;
//   expandAll: (folderIds: string[]) => void;
// }

// /**
//  * Folder Store
//  *
//  * Manages folder-specific UI state with persistence.
//  * This store handles:
//  * - Which folder is currently selected
//  * - Which folders are expanded/collapsed
//  *
//  * Note: Folder DATA (name, color, etc.) is managed by React Query in useFolders()
//  * This store only manages UI state.
//  *
//  * @example
//  * ```tsx
//  * const { selectedFolderId, setSelectedFolder } = useFolderStore();
//  *
//  * // Select a folder
//  * setSelectedFolder("folder-id");
//  *
//  * // Check if selected
//  * const isSelected = selectedFolderId === folder.id;
//  * ```
//  */
// export const useFolderStore = create<FolderState>()(
//   persist(
//     (set) => ({
//       // Initial state
//       selectedFolderId: null,
//       expandedFolderIds: new Set<string>(),

//       // Actions
//       setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),

//       toggleExpanded: (folderId) =>
//         set((state) => {
//           const newExpanded = new Set(state.expandedFolderIds);
//           if (newExpanded.has(folderId)) {
//             newExpanded.delete(folderId);
//           } else {
//             newExpanded.add(folderId);
//           }
//           return { expandedFolderIds: newExpanded };
//         }),

//       expandFolder: (folderId) =>
//         set((state) => {
//           const newExpanded = new Set(state.expandedFolderIds);
//           newExpanded.add(folderId);
//           return { expandedFolderIds: newExpanded };
//         }),

//       collapseFolder: (folderId) =>
//         set((state) => {
//           const newExpanded = new Set(state.expandedFolderIds);
//           newExpanded.delete(folderId);
//           return { expandedFolderIds: newExpanded };
//         }),

//       collapseAll: () => set({ expandedFolderIds: new Set<string>() }),

//       expandAll: (folderIds) => set({ expandedFolderIds: new Set(folderIds) }),
//     }),
//     {
//       name: "folder-ui-storage", // localStorage key
//       // Custom storage to handle Set serialization
//       storage: {
//         getItem: (name) => {
//           const str = localStorage.getItem(name);
//           if (!str) return null;
//           const { state } = JSON.parse(str);
//           return {
//             state: {
//               ...state,
//               expandedFolderIds: new Set(state.expandedFolderIds || []),
//             },
//           };
//         },
//         setItem: (name, value) => {
//           const { state } = value;
//           localStorage.setItem(
//             name,
//             JSON.stringify({
//               state: {
//                 ...state,
//                 expandedFolderIds: Array.from(state.expandedFolderIds),
//               },
//             })
//           );
//         },
//         removeItem: (name) => localStorage.removeItem(name),
//       },
//     }
//   )
// );
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Folder UI State
 * Manages folder-specific UI state (selection, expansion, etc.)
 */
interface FolderState {
  /**
   * Currently selected folder ID
   * Used to highlight the active folder in sidebar
   */
  selectedFolderId: string | null;

  /**
   * Set of expanded folder IDs
   * Tracks which folders are showing their children
   */
  expandedFolderIds: Set<string>;

  /**
   * Actions
   */
  setSelectedFolder: (folderId: string | null) => void;
  toggleExpanded: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  collapseFolder: (folderId: string) => void;
  collapseAll: () => void;
  expandAll: (folderIds: string[]) => void;
}

/**
 * Folder Store
 *
 * Manages folder-specific UI state with persistence.
 * This store handles:
 * - Which folder is currently selected
 * - Which folders are expanded/collapsed
 *
 * Note: Folder DATA (name, color, etc.) is managed by React Query in useFolders()
 * This store only manages UI state.
 *
 * @example
 * ```tsx
 * const { selectedFolderId, setSelectedFolder } = useFolderStore();
 *
 * // Select a folder
 * setSelectedFolder("folder-id");
 *
 * // Check if selected
 * const isSelected = selectedFolderId === folder.id;
 * ```
 */
export const useFolderStore = create<FolderState>()(
  persist(
    (set) => ({
      // Initial state
      selectedFolderId: null,
      expandedFolderIds: new Set<string>(),

      // Actions
      setSelectedFolder: (folderId) => set({ selectedFolderId: folderId }),

      toggleExpanded: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
          } else {
            newExpanded.add(folderId);
          }
          return { expandedFolderIds: newExpanded };
        }),

      expandFolder: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          newExpanded.add(folderId);
          return { expandedFolderIds: newExpanded };
        }),

      collapseFolder: (folderId) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolderIds);
          newExpanded.delete(folderId);
          return { expandedFolderIds: newExpanded };
        }),

      collapseAll: () => set({ expandedFolderIds: new Set<string>() }),

      expandAll: (folderIds) => set({ expandedFolderIds: new Set(folderIds) }),
    }),
    {
      name: "folder-ui-storage", // localStorage key
      // Custom storage to handle Set serialization
      storage: createJSONStorage(() => localStorage),
      // Custom serialization for Set
      partialize: (state) => ({
        selectedFolderId: state.selectedFolderId,
        expandedFolderIds: Array.from(state.expandedFolderIds),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.expandedFolderIds)) {
          state.expandedFolderIds = new Set(state.expandedFolderIds);
        }
      },
    }
  )
);
