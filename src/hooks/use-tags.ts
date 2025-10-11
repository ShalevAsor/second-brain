import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  addTagToNote,
  removeTagFromNote,
  getNotesByTag,
  type TagWithCount,
} from "@/actions/tagActions";
import type {
  CreateTagInput,
  UpdateTagInput,
  DeleteTagInput,
  AddTagToNoteInput,
  RemoveTagFromNoteInput,
} from "@/schemas/tagSchemas";

/**
 * Query key for folders
 * Centralized to ensure consistency across the app
 */
export const TAGS_QUERY_KEY = ["tags"] as const;

/**
 * Hook to fetch all tags with note counts
 * Sorted by usage (most used first)
 */
export function useTags() {
  return useQuery({
    queryKey: TAGS_QUERY_KEY,
    queryFn: async () => {
      const result = await getAllTags();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
  });
}

/**
 * Hook to create a new tag
 * Optimistically updates the tag list
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTagInput) => {
      const result = await createTag(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onMutate: async (newTag) => {
      // cancel outgoing refetch
      await queryClient.cancelQueries({ queryKey: TAGS_QUERY_KEY });

      // snapshot previous state
      const previousTags =
        queryClient.getQueryData<TagWithCount[]>(TAGS_QUERY_KEY);

      // optimistically add tag with 0 count
      if (previousTags) {
        const optimisticTag: TagWithCount = {
          id: `temp-${Date.now()}`,
          name: newTag.name,
          userId: "temp",
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: { notes: 0 },
        };

        queryClient.setQueryData<TagWithCount[]>(TAGS_QUERY_KEY, [
          ...previousTags,
          optimisticTag,
        ]);
      }
      return { previousTags };
    },
    onError: (error, variables, context) => {
      // rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(TAGS_QUERY_KEY, context.previousTags);
      }
      toast.error(error.message);
    },
    onSuccess: (data) => {
      toast.success(`Tag "${data.name}" created`);
    },
    onSettled: () => {
      // refetch to sync with server
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
    },
  });
}

/**
 * Hook to update (rename) a tag
 * Optimistically updates the tag in the list
 */
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTagInput) => {
      const result = await updateTag(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    onMutate: async (updatedTag) => {
      await queryClient.cancelQueries({ queryKey: TAGS_QUERY_KEY });

      const previousTags =
        queryClient.getQueryData<TagWithCount[]>(TAGS_QUERY_KEY);

      // Optimistically update tag name
      if (previousTags) {
        queryClient.setQueryData<TagWithCount[]>(
          TAGS_QUERY_KEY,
          previousTags.map((tag) =>
            tag.id === updatedTag.tagId
              ? { ...tag, name: updatedTag.name, updatedAt: new Date() }
              : tag
          )
        );
      }

      return { previousTags };
    },

    onError: (error, variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(TAGS_QUERY_KEY, context.previousTags);
      }
      toast.error(error.message);
    },

    onSuccess: (data) => {
      toast.success(`Tag renamed to "${data.name}"`);
    },
    // TODO: use notes query key constants
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] }); // Notes display tag names
    },
  });
}

/**
 * Hook to delete a tag
 * Optimistically removes tag from the list
 */
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteTagInput) => {
      const result = await deleteTag(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    onMutate: async (deletedTag) => {
      await queryClient.cancelQueries({ queryKey: TAGS_QUERY_KEY });

      const previousTags =
        queryClient.getQueryData<TagWithCount[]>(TAGS_QUERY_KEY);

      // Optimistically remove tag
      if (previousTags) {
        queryClient.setQueryData<TagWithCount[]>(
          TAGS_QUERY_KEY,
          previousTags.filter((tag) => tag.id !== deletedTag.tagId)
        );
      }

      return { previousTags };
    },

    onError: (error, variables, context) => {
      if (context?.previousTags) {
        queryClient.setQueryData(TAGS_QUERY_KEY, context.previousTags);
      }
      toast.error(error.message);
    },

    onSuccess: (data) => {
      toast.success(`Tag "${data.name}" deleted`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] }); // Notes may have displayed this tag
    },
  });
}
/**
 * Hook to add a tag to a note
 * Invalidates both tags and notes queries
 */
export function useAddTagToNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTagToNoteInput) => {
      const result = await addTagToNote(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    onSuccess: () => {
      toast.success("Tag added to note");
    },

    onError: (error) => {
      toast.error(error.message);
    },

    onSettled: () => {
      // Invalidate both tags (counts changed) and notes (tags changed)
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

/**
 * Hook to remove a tag from a note
 * Invalidates both tags and notes queries
 */
export function useRemoveTagFromNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveTagFromNoteInput) => {
      const result = await removeTagFromNote(input);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },

    onSuccess: () => {
      toast.success("Tag removed from note");
    },

    onError: (error) => {
      toast.error(error.message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
/**
 * Hook to fetch notes filtered by a specific tag
 * Used for /notes?tag=xyz view
 */
export function useNotesByTag(tagId: string | null) {
  return useQuery({
    queryKey: ["notes", "by-tag", tagId],
    queryFn: async () => {
      if (!tagId) return [];

      const result = await getNotesByTag({ tagId });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!tagId, // Only run query if tagId exists
  });
}
