import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} from "@/actions/folderActions";
import {
  type CreateFolderInput,
  type UpdateFolderInput,
  type DeleteFolderInput,
  FolderColor,
} from "@/schemas/folderSchemas";
import type { FolderWithRelations } from "@/types/folderTypes";
import { toast } from "sonner";
import { FOLDERS_QUERY_KEY, NOTES_QUERY_KEY } from "@/lib/query-keys";
import { useRouter } from "next/navigation";

/**
 * Hook to fetch all folders for the authenticated user
 *
 * Features:
 * - Automatic caching
 * - Loading and error states
 * - Automatic refetch on window focus (configurable)
 * - Stale-while-revalidate pattern
 *
 * @returns Query result with folders data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: folders, isLoading, error } = useFolders();
 * ```
 */

export function useFolders(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: async () => {
      const result = await getFolders();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch folders");
      }
      return result.data as FolderWithRelations[];
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to create a new folder with optimistic updates
 *
 * Features:
 * - Optimistic UI update
 * - Automatic rollback on error
 * - Automatic cache invalidation on success
 * - Toast notifications
 * - Loading state
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const createFolderMutation = useCreateFolder();
 *
 * createFolderMutation.mutate({
 *   name: "New Folder",
 *   parentId: null,
 *   color: FolderColor.BLUE
 * });
 * ```
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFolderInput) => {
      const result = await createFolder(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to create folder");
      }

      return result.data;
    },

    // Optimistic update: Add folder to cache immediately
    onMutate: async (newFolder) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: FOLDERS_QUERY_KEY });

      // Snapshot the previous value
      const previousFolders =
        queryClient.getQueryData<FolderWithRelations[]>(FOLDERS_QUERY_KEY);

      // Optimistically update to the new value
      if (previousFolders) {
        // Create temporary folder with optimistic ID
        const optimisticFolder: FolderWithRelations = {
          id: `temp-${crypto.randomUUID()}`, // Temporary ID
          name: newFolder.name,
          color: newFolder.color || FolderColor.GRAY,
          parentId: newFolder.parentId || null,
          isDefault: false,
          depth: 0,
          userId: "temp-user", // Will be replaced by real data
          createdAt: new Date(),
          updatedAt: new Date(),
          children: [],
          _count: { notes: 0 },
        };

        queryClient.setQueryData<FolderWithRelations[]>(FOLDERS_QUERY_KEY, [
          ...previousFolders,
          optimisticFolder,
        ]);
      }

      // Return context with previous data for rollback
      return { previousFolders };
    },

    // If mutation fails, use the context returned from onMutate to roll back
    onError: (error: Error, newFolder, context) => {
      // Rollback to previous state
      if (context?.previousFolders) {
        queryClient.setQueryData(FOLDERS_QUERY_KEY, context.previousFolders);
      }

      // Show error toast
      toast.error(error.message || "Failed to create folder");
    },

    // Always refetch after error or success to ensure we have correct data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },

    onSuccess: () => {
      // Show success toast
      toast.success("Folder created successfully");
    },
  });
}

/**
 * Hook to update an existing folder with optimistic updates
 *
 * Features:
 * - Optimistic UI update (changes appear immediately)
 * - Automatic rollback on error
 * - Automatic cache invalidation on success
 * - Toast notifications
 * - Loading state
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const updateFolderMutation = useUpdateFolder();
 *
 * updateFolderMutation.mutate({
 *   id: "folder-id",
 *   name: "Updated Name",
 *   color: FolderColor.RED
 * });
 * ```
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFolderInput) => {
      const result = await updateFolder(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to update folder");
      }

      return result.data;
    },

    // Optimistic update: Update folder in cache immediately
    onMutate: async (updatedFolder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: FOLDERS_QUERY_KEY });

      // Snapshot the previous value
      const previousFolders =
        queryClient.getQueryData<FolderWithRelations[]>(FOLDERS_QUERY_KEY);

      // Optimistically update the folder
      if (previousFolders) {
        queryClient.setQueryData<FolderWithRelations[]>(
          FOLDERS_QUERY_KEY,
          previousFolders.map((folder) =>
            folder.id === updatedFolder.id
              ? {
                  ...folder,
                  // Only update fields that were provided
                  ...(updatedFolder.name && { name: updatedFolder.name }),
                  ...(updatedFolder.color && { color: updatedFolder.color }),
                  ...(updatedFolder.parentId !== undefined && {
                    parentId: updatedFolder.parentId,
                  }),
                  updatedAt: new Date(),
                }
              : folder
          )
        );
      }

      // Return context with previous data for rollback
      return { previousFolders };
    },

    // Rollback on error
    onError: (error: Error, updatedFolder, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(FOLDERS_QUERY_KEY, context.previousFolders);
      }

      toast.error(error.message || "Failed to update folder");
    },

    onSettled: () => {
      // - folders: Folder name/color/parent changed (sidebar updates)
      // - notes: Note cards display folder name/color (must refresh if folder changed)
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },

    onSuccess: () => {
      toast.success("Folder updated successfully");
    },
  });
}

/**
 * Hook to delete a folder with optimistic updates
 *
 * Features:
 * - Optimistic UI update (folder disappears immediately)
 * - Automatic rollback on error
 * - Automatic cache invalidation on success
 * - Toast notifications
 * - Loading state
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```tsx
 * const deleteFolderMutation = useDeleteFolder();
 *
 * deleteFolderMutation.mutate({ id: "folder-id" });
 * ```
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (input: DeleteFolderInput) => {
      const result = await deleteFolder(input);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete folder");
      }

      return result.data;
    },

    // Optimistic update: Remove folder from cache immediately
    onMutate: async (deletedFolder) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: FOLDERS_QUERY_KEY });

      // Snapshot the previous value
      const previousFolders =
        queryClient.getQueryData<FolderWithRelations[]>(FOLDERS_QUERY_KEY);

      // Optimistically remove the folder (and its children due to cascade)
      if (previousFolders) {
        queryClient.setQueryData<FolderWithRelations[]>(
          FOLDERS_QUERY_KEY,
          previousFolders.filter((folder) => folder.id !== deletedFolder.id)
        );
      }

      // Return context with previous data for rollback
      return { previousFolders };
    },

    // Rollback on error
    onError: (error: Error, deletedFolder, context) => {
      if (context?.previousFolders) {
        queryClient.setQueryData(FOLDERS_QUERY_KEY, context.previousFolders);
      }

      toast.error(error.message || "Failed to delete folder");
    },

    // Always refetch to ensure correct data
    onSuccess: () => {
      toast.success("Folder deleted successfully");

      router.push("/notes");
    },
    onSettled: () => {
      // Why invalidate both?
      // - folders: Folder removed from sidebar (including children via cascade)
      // - notes: Notes in deleted folder now orphaned (folderId: null), must refresh to show "No folder"
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}
