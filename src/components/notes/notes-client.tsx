// src/components/notes/notes-page-client.tsx
"use client";

import { useState } from "react";
import { SearchFilter } from "@/components/notes/search-filter";
import { NotesContent } from "@/components/notes/notes-content";
import { filterNotes } from "@/lib/filter-utils";
import {
  useAllNotes,
  useNotesByFolder,
  useNotesByTag,
} from "@/hooks/use-notes";
import { useFavoriteNotes } from "@/hooks/use-favorites";
import type { NoteView } from "@/app/(main)/notes/page";

interface NotesClientProps {
  view: NoteView;
  folderId?: string;
  tagId?: string;
}

export function NotesClient({ view, folderId, tagId }: NotesClientProps) {
  // Local search state
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch the appropriate data
  const allNotesQuery = useAllNotes({ enabled: view === "all" });
  const folderNotesQuery = useNotesByFolder(folderId || null, {
    enabled: view === "folder" && !!folderId,
  });
  const tagNotesQuery = useNotesByTag(tagId || null, {
    enabled: view === "tag" && !!tagId,
  });
  const favoriteNotesQuery = useFavoriteNotes({
    enabled: view === "favorites",
  });

  // Select the right query
  const query =
    view === "folder"
      ? folderNotesQuery
      : view === "tag"
      ? tagNotesQuery
      : view === "favorites"
      ? favoriteNotesQuery
      : allNotesQuery;

  const { data: notes = [], isLoading, error } = query;

  // Apply client-side filtering
  const filteredNotes = filterNotes(notes, searchQuery);

  // Get placeholder text based on view
  const getPlaceholder = () => {
    if (view === "favorites") return "Filter favorites...";
    if (view === "folder") return "Filter in this folder...";
    if (view === "tag") return "Filter in this tag...";
    return "Filter notes...";
  };

  return (
    <>
      {/* Search Filter */}
      <div className="flex items-center gap-3">
        <SearchFilter
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={getPlaceholder()}
          className="flex-1 max-w-md"
        />
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredNotes.length}{" "}
            {filteredNotes.length === 1 ? "result" : "results"}
          </p>
        )}
      </div>

      {/* Notes Content */}
      <NotesContent
        view={view}
        folderId={folderId}
        tagId={tagId}
        searchQuery={searchQuery}
        notes={filteredNotes}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}
