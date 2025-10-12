"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toggleNoteFavorite, getFavoriteNotes } from "@/actions/noteActions";
import { toast } from "sonner";
import {
  FAVORITES_QUERY_KEY,
  NOTES_QUERY_KEY,
  noteKeys,
} from "@/lib/query-keys";
import { NoteWithRelations } from "@/types/noteTypes";

/**
 * Type for a favorite note (matches the return type from getFavoriteNotes)
 */
type FavoriteNote = {
  id: string;
  title: string;
  content: string;
  folderId: string | null;
  folder: { id: string; name: string; color: string } | null;
  tags: string[];
  updatedAt: Date;
};

/**
 * Hook to fetch all favorite notes
 *
 * Uses React Query to cache results and automatically refetch when needed.
 * The query key "favorites" is used for cache management.
 *
 * @returns React Query result with favorites data
 *
 * @example
 * const { data: favorites, isLoading, error } = useFavoriteNotes();
 */
export function useFavoriteNotes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    // function to fetches the data
    queryFn: async () => {
      const result = await getFavoriteNotes();
      // if server action failed throw error so react query knows
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to toggle favorite status of a note
 *
 * Features:
 * - Optimistic updates (instant UI feedback)
 * - Automatic rollback on error
 * - Toast notifications
 * - Cache invalidation
 *
 * @returns React Query mutation object
 *
 * @example
 * const toggleFavorite = useToggleFavorite();
 * toggleFavorite.mutate(noteId);
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (noteId: string) => {
      const result = await toggleNoteFavorite({ noteId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    onMutate: async (noteId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });

      // Snapshot previous state
      const previousFavorites =
        queryClient.getQueryData<FavoriteNote[]>(FAVORITES_QUERY_KEY);
      const previousNotes = queryClient.getQueryData<NoteWithRelations[]>(
        noteKeys.all()
      );

      // Get note data from the all notes query
      const allNotes = queryClient.getQueryData<NoteWithRelations[]>(
        noteKeys.all()
      );
      const noteData = allNotes?.find((n) => n.id === noteId);

      // Optimistically update favorites cache
      queryClient.setQueryData<FavoriteNote[]>(FAVORITES_QUERY_KEY, (old) => {
        if (!old) return old;

        const existingIndex = old.findIndex((note) => note.id === noteId);

        if (existingIndex >= 0) {
          // Removing from favorites
          return old.filter((note) => note.id !== noteId);
        } else if (noteData) {
          // ⭐ Adding to favorites with correct type mapping
          const newFavorite: FavoriteNote = {
            id: noteData.id,
            title: noteData.title,
            content: noteData.content,
            folderId: noteData.folderId,
            folder: noteData.folder, // ⭐ Already correct structure
            tags: noteData.tags?.map((t) => t.tag.name) || [], // ⭐ Extract tag names from junction
            updatedAt: noteData.updatedAt,
          };
          return [newFavorite, ...old]; // Add to beginning
        }

        return old;
      });

      // Optimistically update notes list (toggle isFavorite flag)
      queryClient.setQueryData<NoteWithRelations[]>(noteKeys.all(), (old) => {
        if (!old) return old;
        return old.map((note) =>
          note.id === noteId ? { ...note, isFavorite: !note.isFavorite } : note
        );
      });

      return { previousFavorites, previousNotes };
    },

    onError: (error, noteId, context) => {
      // Rollback on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(
          FAVORITES_QUERY_KEY,
          context.previousFavorites
        );
      }
      if (context?.previousNotes) {
        queryClient.setQueryData<NoteWithRelations[]>(
          noteKeys.all(),
          context.previousNotes
        );
      }
      toast.error("Failed to update favorite");
      console.error("Toggle favorite error:", error);
    },

    onSuccess: (data) => {
      toast.success(
        data.isFavorite ? "Added to favorites" : "Removed from favorites"
      );
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}
