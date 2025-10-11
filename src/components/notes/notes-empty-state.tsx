// src/components/notes/notes-empty-state.tsx
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NoteView } from "@/app/(main)/notes/page";

interface NotesEmptyStateProps {
  view: NoteView;
  folderId?: string;
  tagId?: string;
}

export function NotesEmptyState({
  view,
  folderId,
  tagId,
}: NotesEmptyStateProps) {
  const getMessage = () => {
    if (view === "folder") {
      return {
        title: "No notes in this folder yet",
        description: "Create your first note to get started",
      };
    }
    if (view === "tag") {
      return {
        title: "No notes with this tag yet",
        description: "Create a note and add this tag to see it here",
      };
    }
    if (view === "favorites") {
      return {
        title: "No favorite notes yet",
        description: "Star notes to add them to your favorites",
      };
    }
    return {
      title: "No notes yet",
      description: "Create your first note to start organizing your knowledge",
    };
  };

  const { title, description } = getMessage();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {view === "folder" && folderId && (
        <Button size="sm" asChild className="mt-6">
          <Link href={`/notes/new?folder=${folderId}`}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Link>
        </Button>
      )}
      {view === "tag" && tagId && (
        <Button size="sm" asChild className="mt-6">
          <Link href={`/notes/new?tag=${tagId}`}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Link>
        </Button>
      )}
      {view == "all" && (
        <Button asChild className="mt-6">
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Note
          </Link>
        </Button>
      )}
    </div>
  );
}
