// "use client";

// import { Star } from "lucide-react";
// import Link from "next/link";
// import { useFavoriteNotes } from "@/hooks/use-favorites";
// import { SidebarSection } from "@/components/sidebar/shared/sidebar-section";
// import { SidebarMenu } from "@/components/ui/sidebar";
// import { SidebarLoading } from "@/components/sidebar/shared/sidebar-loading";
// import { SidebarEmptyState } from "@/components/sidebar/shared/sidebar-empty-state";
// import { FavoriteNoteCard } from "@/components/sidebar/favorites/favorite-note-card";
// import { useSidebarUIStore } from "@/stores/sidebarUIStore";

// /**
//  * Favorites Navigation Component
//  *
//  * Displays favorite notes in the sidebar.
//  *
//  * Features:
//  * - Real-time data from React Query (useFavoriteNotes)
//  * - Shows up to 5 favorites with "View all" link if more
//  * - Loading state, empty state, and error handling
//  * - Click note → Navigate to /notes/:id
//  * - Collapsible section with state persistence
//  *
//  * State Management:
//  * - Favorites data: React Query (useFavoriteNotes)
//  * - Section open/closed: Zustand (useSidebarUIStore)
//  */
// export function NavFavorites() {
//   const { sections, toggleSection } = useSidebarUIStore();
//   const { data: favorites = [], isLoading } = useFavoriteNotes();

//   const favoriteCount = favorites.length;

//   return (
//     <SidebarSection
//       title="Favorites"
//       icon={Star}
//       count={favoriteCount}
//       isOpen={sections.favorites}
//       onToggle={() => toggleSection("favorites")}
//     >
//       <SidebarMenu>
//         {/* Loading state */}
//         {isLoading && <SidebarLoading count={3} />}

//         {/* Empty state */}
//         {!isLoading && favoriteCount === 0 && (
//           <SidebarEmptyState message="No favorites yet" />
//         )}

//         {/* Favorites list */}
//         {!isLoading && favoriteCount > 0 && (
//           <>
//             {/* Show first 5 favorites */}
//             {favorites.slice(0, 5).map((note) => (
//               <FavoriteNoteCard key={note.id} note={note} />
//             ))}

//             {/* "View all" link if more than 5 */}
//             {favoriteCount > 5 && <ViewAllLink count={favoriteCount} />}
//           </>
//         )}
//       </SidebarMenu>
//     </SidebarSection>
//   );
// }

// /**
//  * "View all" link component
//  *
//  * Shows when there are more than 5 favorites.
//  * Navigates to a filtered view showing all favorites.
//  */
// function ViewAllLink({ count }: { count: number }) {
//   return (
//     <div className="px-2 py-1">
//       <Link
//         href="/notes?favorites=true"
//         className="block px-3 py-2 text-xs text-center text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-sidebar-accent"
//       >
//         View all ({count})
//       </Link>
//     </div>
//   );
// }
"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFavoriteNotes } from "@/hooks/use-favorites";
import { SidebarSection } from "@/components/sidebar/shared/sidebar-section";
import { SidebarMenu } from "@/components/ui/sidebar";
import { SidebarLoading } from "@/components/sidebar/shared/sidebar-loading";
import { SidebarEmptyState } from "@/components/sidebar/shared/sidebar-empty-state";
import { FavoriteNoteCard } from "@/components/sidebar/favorites/favorite-note-card";
import { useSidebarUIStore } from "@/stores/sidebarUIStore";
import { cn } from "@/lib/utils";

/**
 * Favorites Navigation Component
 *
 * Displays favorite notes in the sidebar.
 *
 * Features:
 * - Real-time data from React Query (useFavoriteNotes)
 * - Shows up to 5 favorites with "View all" link if more
 * - Loading state, empty state, and error handling
 * - Click note → Navigate to /notes/:id (hard nav - opens editor)
 * - Click "View all" → Navigate to /notes?favorites=true (soft nav)
 * - Active state for "View all" button
 * - Collapsible section with state persistence
 *
 * State Management:
 * - Favorites data: React Query (useFavoriteNotes)
 * - Section open/closed: Zustand (useSidebarUIStore)
 */
export function NavFavorites() {
  const searchParams = useSearchParams();
  const isFavoritesView = searchParams.get("favorites") === "true";

  const { sections, toggleSection } = useSidebarUIStore();
  const { data: favorites = [], isLoading } = useFavoriteNotes();

  const favoriteCount = favorites.length;

  return (
    <SidebarSection
      title="Favorites"
      icon={Star}
      count={favoriteCount}
      isOpen={sections.favorites}
      onToggle={() => toggleSection("favorites")}
    >
      <SidebarMenu>
        {/* Loading state */}
        {isLoading && <SidebarLoading count={3} />}

        {/* Empty state */}
        {!isLoading && favoriteCount === 0 && (
          <SidebarEmptyState message="No favorites yet" />
        )}

        {/* Favorites list */}
        {!isLoading && favoriteCount > 0 && (
          <>
            {/* Show first 5 favorites */}
            {favorites.slice(0, 5).map((note) => (
              <FavoriteNoteCard key={note.id} note={note} />
            ))}

            {/* "View all" link if more than 5 */}
            {favoriteCount > 5 && (
              <ViewAllLink count={favoriteCount} isActive={isFavoritesView} />
            )}
          </>
        )}
      </SidebarMenu>
    </SidebarSection>
  );
}

/**
 * "View all" link component
 *
 * Shows when there are more than 5 favorites.
 * Navigates to a filtered view showing all favorites.
 */
function ViewAllLink({
  count,
  isActive,
}: {
  count: number;
  isActive: boolean;
}) {
  return (
    <div className="px-2 py-1">
      <Link
        href="/notes?favorites=true"
        className={cn(
          "block px-3 py-2 text-xs text-center transition-colors rounded-md",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
        )}
      >
        View all ({count})
      </Link>
    </div>
  );
}
