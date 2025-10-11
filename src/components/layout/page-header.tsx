// src/components/layout/page-header.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useFolders } from "@/hooks/use-folders";
import { useTags } from "@/hooks/use-tags";
import { FolderWithRelations } from "@/types/folderTypes";
import { TagWithCount } from "@/actions/tagActions";

export function PageHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fetch data (will be cached by React Query)
  const { data: folders, isLoading: loadingFolders } = useFolders();
  const { data: tags, isLoading: loadingTags } = useTags();

  // Show loading state briefly
  if (loadingFolders || loadingTags) {
    return (
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 h-6" />
          <h1 className="text-lg font-semibold text-muted-foreground">
            Loading...
          </h1>
        </div>
      </header>
    );
  }

  // Get title and actions based on current route
  const { title, actions, showBackButton } = getHeaderConfig(
    pathname,
    searchParams,
    folders || [],
    tags || []
  );

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-6" />

        {/* Show back button for editor pages */}
        {showBackButton && (
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/notes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        )}

        <h1 className="text-lg font-semibold">{title}</h1>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

// Pure function to determine header content
function getHeaderConfig(
  pathname: string,
  searchParams: URLSearchParams,
  folders: FolderWithRelations[],
  tags: TagWithCount[]
) {
  // ==========================================
  // EDITOR PAGES (New & Edit)
  // ==========================================

  // Create note page
  if (pathname === "/notes/new") {
    return {
      title: "New Note",
      actions: null, // No actions in header anymore
      showBackButton: true, // Show back button
    };
  }

  // Edit note page
  if (pathname.startsWith("/notes/") && pathname !== "/notes/new") {
    return {
      title: "Edit Note",
      actions: null, // No actions in header anymore
      showBackButton: true, // Show back button
    };
  }

  // ==========================================
  // NOTES LIST PAGES (All, Folder, Tag, Favorites)
  // ==========================================

  // Notes page with query params
  if (pathname === "/notes") {
    const folderId = searchParams.get("folder");
    const tagId = searchParams.get("tag");
    const isFavorites = searchParams.get("favorites") === "true";

    // Folder view
    if (folderId) {
      const folder = folders.find((f) => f.id === folderId);
      return {
        title: folder ? `📁 ${folder.name}` : "📁 Folder",
        actions: (
          <Button size="sm" asChild>
            <Link href={`/notes/new?folder=${folderId}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Link>
          </Button>
        ),
        showBackButton: false,
      };
    }

    // Tag view
    if (tagId) {
      const tag = tags.find((t) => t.id === tagId);
      return {
        title: tag ? `🏷️ #${tag.name}` : "🏷️ Tag",
        actions: (
          <Button size="sm" asChild>
            <Link href={`/notes/new?tag=${tagId}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Link>
          </Button>
        ),
        showBackButton: false,
      };
    }

    // Favorites view
    if (isFavorites) {
      return {
        title: "⭐ Favorites",
        actions: null,
        showBackButton: false,
      };
    }

    // Default: All notes view
    return {
      title: "All Notes",
      actions: (
        <Button size="sm" asChild>
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Link>
        </Button>
      ),
      showBackButton: false,
    };
  }

  // ==========================================
  // DEFAULT FALLBACK
  // ==========================================

  return {
    title: "Second Brain",
    actions: null,
    showBackButton: false,
  };
}
