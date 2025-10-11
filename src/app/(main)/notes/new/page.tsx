// src/app/(main)/notes/new/page.tsx

import { NoteEditor } from "@/components/editor/note-editor";

interface CreateNotePageProps {
  searchParams: Promise<{
    folder?: string;
  }>;
}

/**
 * Create Note Page
 *
 * Renders the NoteEditor component in create mode.
 * Optionally pre-fills folder from query params (?folder=xyz).
 */
export default async function CreateNotePage({
  searchParams,
}: CreateNotePageProps) {
  const params = await searchParams;
  const folderId = params.folder;

  return <NoteEditor mode="create" initialFolderId={folderId} />;
}
