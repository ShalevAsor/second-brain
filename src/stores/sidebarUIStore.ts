// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// /**
//  * Sidebar section names
//  * Defines all collapsible sections in the sidebar
//  */
// export type SidebarSection = "folders" | "tags" | "favorites";

// /**
//  * Sidebar UI State
//  * Manages global sidebar UI state (section visibility, etc.)
//  */
// interface SidebarUIState {
//   /**
//    * Section visibility state
//    * Tracks which sections are expanded/collapsed
//    */
//   sections: Record<SidebarSection, boolean>;

//   /**
//    * Actions
//    */
//   toggleSection: (section: SidebarSection) => void;
//   setSectionOpen: (section: SidebarSection, isOpen: boolean) => void;
//   openAllSections: () => void;
//   closeAllSections: () => void;
// }

// /**
//  * Sidebar UI Store
//  *
//  * Manages global sidebar UI state with persistence.
//  * This store handles:
//  * - Which sidebar sections are expanded/collapsed (Folders, Tags, Favorites)
//  *
//  * State is persisted to localStorage so it survives page refreshes.
//  *
//  * @example
//  * ```tsx
//  * const { sections, toggleSection } = useSidebarUIStore();
//  *
//  * // Toggle folders section
//  * toggleSection("folders");
//  *
//  * // Check if folders section is open
//  * const isFoldersOpen = sections.folders;
//  * ```
//  */
// export const useSidebarUIStore = create<SidebarUIState>()(
//   persist(
//     (set) => ({
//       // Initial state - all sections open by default
//       sections: {
//         folders: true,
//         tags: true,
//         favorites: true,
//       },

//       // Actions
//       toggleSection: (section) =>
//         set((state) => ({
//           sections: {
//             ...state.sections,
//             [section]: !state.sections[section],
//           },
//         })),

//       setSectionOpen: (section, isOpen) =>
//         set((state) => ({
//           sections: {
//             ...state.sections,
//             [section]: isOpen,
//           },
//         })),

//       openAllSections: () =>
//         set({
//           sections: {
//             folders: true,
//             tags: true,
//             favorites: true,
//           },
//         }),

//       closeAllSections: () =>
//         set({
//           sections: {
//             folders: false,
//             tags: false,
//             favorites: false,
//           },
//         }),
//     }),
//     {
//       name: "sidebar-ui-storage", // localStorage key
//     }
//   )
// );
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Sidebar section names
 * Defines all collapsible sections in the sidebar
 */
export type SidebarSection = "folders" | "tags" | "favorites";

/**
 * Sidebar UI State
 * Manages global sidebar UI state (section visibility, etc.)
 */
interface SidebarUIState {
  /**
   * Section visibility state
   * Tracks which sections are expanded/collapsed
   */
  sections: Record<SidebarSection, boolean>;

  /**
   * Actions
   */
  toggleSection: (section: SidebarSection) => void;
  setSectionOpen: (section: SidebarSection, isOpen: boolean) => void;
  openAllSections: () => void;
  closeAllSections: () => void;
}

/**
 * Sidebar UI Store
 *
 * Manages global sidebar UI state with persistence.
 * This store handles:
 * - Which sidebar sections are expanded/collapsed (Folders, Tags, Favorites)
 *
 * State is persisted to localStorage so it survives page refreshes.
 *
 * @example
 * ```tsx
 * const { sections, toggleSection } = useSidebarUIStore();
 *
 * // Toggle folders section
 * toggleSection("folders");
 *
 * // Check if folders section is open
 * const isFoldersOpen = sections.folders;
 * ```
 */
export const useSidebarUIStore = create<SidebarUIState>()(
  persist(
    (set) => ({
      // Initial state - all sections open by default
      sections: {
        folders: true,
        tags: true,
        favorites: true,
      },

      // Actions
      toggleSection: (section) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [section]: !state.sections[section],
          },
        })),

      setSectionOpen: (section, isOpen) =>
        set((state) => ({
          sections: {
            ...state.sections,
            [section]: isOpen,
          },
        })),

      openAllSections: () =>
        set({
          sections: {
            folders: true,
            tags: true,
            favorites: true,
          },
        }),

      closeAllSections: () =>
        set({
          sections: {
            folders: false,
            tags: false,
            favorites: false,
          },
        }),
    }),
    {
      name: "sidebar-ui-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      skipHydration: false,
    }
  )
);
