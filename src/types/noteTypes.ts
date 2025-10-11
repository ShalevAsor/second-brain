// src/types/noteTypes.ts
import { Note, FolderColor } from "@prisma/client";

/**
 * Note with folder relation (basic folder info)
 */
export type NoteWithFolder = Note & {
  folder: {
    id: string;
    name: string;
    color: string;
  } | null;
};

/**
 * Note with tags relation (through NoteTag junction table)
 */
export type NoteWithTags = Note & {
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
};

/**
 * Complete note with all relations (folder + tags)
 * This is what most queries return
 */
export type NoteWithRelations = Note & {
  folder: {
    id: string;
    name: string;
    color: FolderColor;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
};

/**
 * Simplified tag type for UI display
 * Extracted from the nested NoteTag junction table structure
 */
export type SimpleTag = {
  id: string;
  name: string;
};

/**
 * Helper: Get flat array of tags from NoteWithRelations
 * Converts the nested structure to simple tag objects
 *
 * @example
 * const tags = getNoteTags(note); // [{ id: '1', name: 'python' }, ...]
 */
export function getNoteTags(note: NoteWithRelations): SimpleTag[] {
  return note.tags.map((nt) => nt.tag);
}
