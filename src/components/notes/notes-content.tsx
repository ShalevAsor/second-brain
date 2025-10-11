// src/components/notes/notes-content.tsx
"use client";

import {
  useAllNotes,
  useNotesByFolder,
  useNotesByTag,
} from "@/hooks/use-notes";
import { useFavoriteNotes } from "@/hooks/use-favorites";
import { NoteCard } from "./note-card";
import { NotesEmptyState } from "./notes-empty-state";
import { Loader2 } from "lucide-react";
import { NoteView } from "@/app/(main)/notes/page";
import { SubfoldersSection } from "./subfolders-section";

interface NotesContentProps {
  view: NoteView;
  folderId?: string;
  tagId?: string;
}

export function NotesContent({ view, folderId, tagId }: NotesContentProps) {
  // Fetch data based on view
  const allNotesQuery = useAllNotes();
  const folderNotesQuery = useNotesByFolder(folderId || null);
  const tagNotesQuery = useNotesByTag(tagId || null);
  const favoriteNotesQuery = useFavoriteNotes();

  // Select the right query based on view
  const query =
    view === "folder"
      ? folderNotesQuery
      : view === "tag"
      ? tagNotesQuery
      : view === "favorites"
      ? favoriteNotesQuery
      : allNotesQuery;

  const { data: notes, isLoading, error } = query;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-sm text-destructive">
          Failed to load notes. Please try again.
        </p>
      </div>
    );
  }

  // Empty state
  if (!notes || notes.length === 0) {
    return <NotesEmptyState view={view} folderId={folderId} tagId={tagId} />;
  }

  // Separate pinned (favorites) and recent notes for "all" view
  if (view === "all") {
    const pinnedNotes = notes.filter((note) => note.isFavorite).slice(0, 5);
    const recentNotes = notes.filter((note) => !note.isFavorite);

    return (
      <div className="space-y-8">
        {/* Pinned Notes Section */}
        {pinnedNotes.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">⭐ Pinned Notes</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </section>
        )}

        {/* Recent Notes Section */}
        {recentNotes.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">📝 Recent Notes</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3  2xl:grid-cols-4">
              {recentNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ⭐ FOLDER VIEW - Show subfolders first, then notes
  if (view === "folder" && folderId) {
    return (
      <div className="space-y-8">
        {/* Subfolders Section */}
        <SubfoldersSection parentFolderId={folderId} />

        {/* Notes Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            📝 Notes in This Folder
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  // For tag/favorites views - just show all notes
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">
        {view === "tag" && "📝 Notes Tagged"}
        {view === "favorites" && "📝 Your Favorite Notes"}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </section>
  );
}
