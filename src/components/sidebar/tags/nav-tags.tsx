"use client";

import { Tag } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTags } from "@/hooks/use-tags";
import { SidebarSection } from "@/components/sidebar/shared/sidebar-section";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { SidebarLoading } from "@/components/sidebar/shared/sidebar-loading";
import { SidebarEmptyState } from "@/components/sidebar/shared/sidebar-empty-state";
import { useSidebarUIStore } from "@/stores/sidebarUIStore";

/**
 * Tags Navigation Component
 *
 * Displays tags with note counts in the sidebar.
 *
 * Features:
 * - Real-time data from React Query (useTags)
 * - Shows top 10 tags sorted by usage
 * - "View all" link if more than 10 tags
 * - Loading state, empty state, and error handling
 * - Click tag → Navigate to /notes?tag=tagId (soft nav)
 * - Active state highlighting based on URL
 * - Collapsible section with state persistence
 * - [+] button for future tag management
 *
 * State Management:
 * - Tags data: React Query (useTags)
 * - Section open/closed: Zustand (useSidebarUIStore)
 */
export function NavTags() {
  const searchParams = useSearchParams();
  const currentTagId = searchParams.get("tag");

  const { sections, toggleSection } = useSidebarUIStore();
  const { data: tags = [], isLoading } = useTags();

  const tagCount = tags.length;
  const topTags = tags.slice(0, 10); // Show top 10 tags

  return (
    <SidebarSection
      title="Tags"
      icon={Tag}
      count={tagCount}
      isOpen={sections.tags}
      onToggle={() => toggleSection("tags")}
    >
      <SidebarMenu>
        {/* Loading state */}
        {isLoading && <SidebarLoading count={5} />}

        {/* Empty state */}
        {!isLoading && tagCount === 0 && (
          <SidebarEmptyState message="No tags yet" />
        )}

        {/* Tags list */}
        {!isLoading && tagCount > 0 && (
          <>
            {/* Show top 10 tags */}
            {topTags.map((tag) => {
              const isActive = currentTagId === tag.id;

              return (
                <SidebarMenuItem key={tag.id}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={`/notes?tag=${tag.id}`}>
                      <Tag className="h-4 w-4" />
                      <span className="flex-1">#{tag.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {tag._count.notes}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

            {/* "View all" link if more than 10 */}
            {tagCount > 10 && <ViewAllLink count={tagCount} />}
          </>
        )}
      </SidebarMenu>
    </SidebarSection>
  );
}

/**
 * "View all" link component
 *
 * Shows when there are more than 10 tags.
 * Navigates to a view showing all tags.
 */
function ViewAllLink({ count }: { count: number }) {
  return (
    <div className="px-2 py-1">
      <Link
        href="/notes?view=all-tags"
        className="block px-3 py-2 text-xs text-center text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-sidebar-accent"
      >
        View all ({count})
      </Link>
    </div>
  );
}
