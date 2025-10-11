"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAllNotes,
  getNote,
  getNotesByFolder,
  getNotesByTag,
  createNote,
  updateNote,
  deleteNote,
} from "@/actions/noteActions";
import type { NoteWithRelations } from "@/types/noteTypes";
import type { CreateNoteInput, UpdateNoteInput } from "@/schemas/noteSchemas";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { FAVORITES_QUERY_KEY } from "./use-favorites";
/*
QUERY KEY CONSTANTS
*/
export const NOTES_QUERY_KEY = ["notes"] as const;
export const ALL_NOTES_QUERY_KEY = ["notes", "all"] as const;

// Query key factories
export const noteKeys = {
  all: () => ALL_NOTES_QUERY_KEY,
  byFolder: (folderId: string) => ["notes", "folder", folderId] as const,
  byTag: (tagId: string) => ["notes", "tag", tagId] as const,
  detail: (noteId: string) => ["notes", noteId] as const,
};

/**
 * Hook to fetch all notes for the current user
 * Used in: Default /notes view
 */
export function useAllNotes() {
  return useQuery({
    queryKey: noteKeys.all(),
    queryFn: async () => {
      const result = await getAllNotes();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch notes");
      }
      return result.data;
    },
  });
}
/**
 * Hook to fetch notes by folder ID
 * Used in: /notes?tag=xyz view
 */
export function useNotesByFolder(folderId: string | null) {
  return useQuery({
    queryKey: folderId
      ? noteKeys.byFolder(folderId)
      : ["notes", "folder", null],
    queryFn: async () => {
      if (!folderId) return [];
      const result = await getNotesByFolder(folderId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!folderId, // Only run query if folderId exists
  });
}

/**
 * Hook to fetch notes by tag ID
 * Used in: /notes?tag=xyz view
 */
export function useNotesByTag(tagId: string | null) {
  return useQuery({
    queryKey: tagId ? noteKeys.byTag(tagId) : ["notes", "tag", null],
    queryFn: async () => {
      if (!tagId) return [];

      const result = await getNotesByTag(tagId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!tagId, // Only run query if tagId exists
  });
}

/**
 * Hook to fetch a single note by ID
 * Used in: /notes/:id (editor view)
 */
export function useNoteById(
  noteId: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: noteId ? noteKeys.detail(noteId) : ["notes", null],
    queryFn: async () => {
      if (!noteId) return null;
      const result = await getNote(noteId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: options?.enabled ?? !!noteId, // Use options if provided, otherwise default behavior
  });
}
//MUTATION HOOKS

/**
 * Hook to create a new note
 * Includes optimistic update and cache invalidation
 */
export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNoteInput) => {
      const result = await createNote(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newNote) => {
      // cancel outgoing refetch
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });
      // Snapshot previous value
      const previousNotes = queryClient.getQueryData<NoteWithRelations[]>(
        noteKeys.all()
      );
      // optimistically update cache
      queryClient.setQueryData<NoteWithRelations[]>(noteKeys.all(), (old) => {
        if (!old) return old;
        const optimisticNote: NoteWithRelations = {
          id: `temp-${Date.now()}`,
          title: newNote.title,
          content: newNote.content,
          folderId: newNote.folderId ?? null,
          folder: null,
          tags: [],
          isAutoOrganized: newNote.isAutoOrganized ?? false,
          isFavorite: false,
          aiSuggestions: newNote.aiSuggestions ?? null,
          userId: "temp-user",
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return [optimisticNote, ...old];
      });
      return { previousNotes };
    },
    onError(error, variables, context) {
      // rollback
      if (context?.previousNotes) {
        queryClient.setQueryData(noteKeys.all(), context.previousNotes);
      }
      // toast
      toast.error(error.message);
    },
    onSuccess: () => {
      // toast.success(
      //   variables.title ? `"${variables.title}" created` : "Note created"
      // );
      // // Navigate to the new note
      // if (data?.id) {
      //   router.push(`/notes/${data.id}`);
      // }
    },

    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}
/**
 * Hook to update an existing note
 * Includes optimistic update and cache invalidation
 */
export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateNoteInput) => {
      const result = await updateNote(input);
      if (!result.success) {
        throw new Error(result.error || "Failed to update note");
      }
      return result.data;
    },

    onMutate: async (updatedNote) => {
      const noteId = updatedNote.id;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });

      // Snapshot previous values
      const previousNote = queryClient.getQueryData<NoteWithRelations>(
        noteKeys.detail(noteId)
      );
      const previousAllNotes = queryClient.getQueryData<NoteWithRelations[]>(
        noteKeys.all()
      );

      // Optimistically update single note cache
      queryClient.setQueryData<NoteWithRelations>(
        noteKeys.detail(noteId),
        (old) => {
          if (!old) return old;
          return { ...old, ...updatedNote, updatedAt: new Date() };
        }
      );

      // Optimistically update all notes cache
      queryClient.setQueryData<NoteWithRelations[]>(noteKeys.all(), (old) => {
        if (!old) return old;
        return old.map((note) =>
          note.id === noteId
            ? { ...note, ...updatedNote, updatedAt: new Date() }
            : note
        );
      });

      return { previousNote, previousAllNotes, noteId };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousNote) {
        queryClient.setQueryData(
          noteKeys.detail(context.noteId),
          context.previousNote
        );
      }
      if (context?.previousAllNotes) {
        queryClient.setQueryData(noteKeys.all(), context.previousAllNotes);
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to update note"
      );
    },

    onSuccess: () => {
      // toast.success("Note updated");
    },

    onSettled: (data) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
      if (data?.isFavorite) {
        queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
      }
    },
  });
}

/**
 * Hook to delete a note
 * Includes optimistic update and cache invalidation
 */
export function useDeleteNote() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (noteId: string) => {
      const result = await deleteNote(noteId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete note");
      }
      return result.data;
    },

    onMutate: async (noteId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });

      // Snapshot previous values
      const previousAllNotes = queryClient.getQueryData<NoteWithRelations[]>(
        noteKeys.all()
      );

      // Optimistically remove from cache
      queryClient.setQueryData<NoteWithRelations[]>(noteKeys.all(), (old) => {
        if (!old) return old;
        return old.filter((note) => note.id !== noteId);
      });

      // Remove single note from cache
      queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) });

      return { previousAllNotes, noteId };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousAllNotes) {
        queryClient.setQueryData(noteKeys.all(), context.previousAllNotes);
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to delete note"
      );
    },

    onSuccess: () => {
      toast.success("Note deleted");

      // Navigate back to notes list
      router.push("/notes");
    },

    onSettled: () => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}
