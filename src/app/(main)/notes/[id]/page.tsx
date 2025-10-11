// src/app/(main)/notes/[id]/page.tsx

import { NoteEditor } from "@/components/editor/note-editor";

interface EditNotePageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Edit Note Page
 *
 * Renders the NoteEditor component in edit mode.
 * Loads existing note data by ID.
 */
export default async function EditNotePage({ params }: EditNotePageProps) {
  const { id: noteId } = await params;

  return <NoteEditor mode="edit" noteId={noteId} />;
}
