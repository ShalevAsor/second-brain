// src/components/notes/notes-header.tsx
"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFolders } from "@/hooks/use-folders";
import { useTags } from "@/hooks/use-tags";

interface NotesHeaderProps {
  view: "all" | "folder" | "tag" | "favorites";
  folderId?: string;
  tagId?: string;
}

export function NotesHeader({ view, folderId, tagId }: NotesHeaderProps) {
  const { data: folders } = useFolders();
  const { data: tags } = useTags();

  // Get display title based on view
  const getTitle = () => {
    if (view === "folder" && folderId) {
      const folder = folders?.find((f) => f.id === folderId);
      return `📁 ${folder?.name || "Folder"}`;
    }
    if (view === "tag" && tagId) {
      const tag = tags?.find((t) => t.id === tagId);
      return `🏷️ #${tag?.name || "tag"}`;
    }
    if (view === "favorites") {
      return "⭐ Favorites";
    }
    return "All Notes";
  };

  // Get metadata text
  const getMetadata = () => {
    // We'll add note counts later
    return null;
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getTitle()}</h1>
          {getMetadata() && (
            <p className="text-sm text-muted-foreground">{getMetadata()}</p>
          )}
        </div>

        {/* [+ New] Button - Hide in favorites view */}
        {view !== "favorites" && (
          <Button asChild>
            <Link href="/notes/new">
              <Plus className="mr-2 h-4 w-4" />
              New Note
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
