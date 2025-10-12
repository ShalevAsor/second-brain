// src/lib/filter-utils.ts

import type { NoteWithRelations } from "@/types/noteTypes";

/**
 * Filters notes based on search query
 * Searches in: title, content, tags, folder name
 */
export function filterNotes(
  notes: NoteWithRelations[],
  searchQuery: string
): NoteWithRelations[] {
  if (!searchQuery.trim()) {
    return notes;
  }

  const query = searchQuery.toLowerCase().trim();

  return notes.filter((note) => {
    // Search in title
    if (note.title.toLowerCase().includes(query)) {
      return true;
    }

    // Search in content (strip HTML/markdown for better results)
    const plainContent = note.content.replace(/<[^>]*>/g, "").toLowerCase();
    if (plainContent.includes(query)) {
      return true;
    }

    // Search in tags
    if (
      note.tags?.some((noteTag) =>
        noteTag.tag.name.toLowerCase().includes(query)
      )
    ) {
      return true;
    }

    // Search in folder name
    if (note.folder?.name.toLowerCase().includes(query)) {
      return true;
    }

    return false;
  });
}
