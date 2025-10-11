// "use client";

// import { useState, useEffect, useCallback, useReducer, useRef } from "react";
// import { useRouter } from "next/navigation";
// import { Input } from "@/components/ui/input";
// import { Separator } from "@/components/ui/separator";
// import { ConfirmAction } from "@/components/common/confirm-action";
// import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
// import { NoteMetadata } from "@/components/notes/note-metadata";
// import { useDebounce } from "@/hooks/use-debounce";
// import {
//   useNoteById,
//   useCreateNote,
//   useUpdateNote,
//   useDeleteNote,
// } from "@/hooks/use-notes";
// import { useAddTagToNote, useRemoveTagFromNote } from "@/hooks/use-tags";
// import { useToggleFavorite } from "@/hooks/use-favorites";
// import { SimpleTag } from "@/types/noteTypes";
// import { SaveStatus } from "@/components/common/auto-save-indicator";
// import {
//   noteFormReducer,
//   getInitialFormState,
// } from "@/reducers/note-form-reducer";
// import { toast } from "sonner";
// import { EDITOR_TIPS } from "@/constants/editor-constants";

// interface NoteEditorProps {
//   mode: "create" | "edit";
//   noteId?: string;
//   initialFolderId?: string | null;
// }

// export function NoteEditor({ mode, noteId, initialFolderId }: NoteEditorProps) {
//   const router = useRouter();

//   // ==========================================
//   // STATE
//   // ==========================================

//   const [form, dispatch] = useReducer(
//     noteFormReducer,
//     getInitialFormState(initialFolderId)
//   );

//   const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
//   const [lastSaved, setLastSaved] = useState<Date>();
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [createdNoteId, setCreatedNoteId] = useState<string | null>(
//     noteId || null
//   );

//   // Refs for tracking state without causing re-renders
//   const skipNextAutoSave = useRef(false);
//   const isSaving = useRef(false);

//   // ==========================================
//   // QUERIES & MUTATIONS
//   // ==========================================

//   // Only fetch note in REAL edit mode (not after creating)
//   const { data: note, isLoading } = useNoteById(noteId || "", {
//     enabled: mode === "edit" && !!noteId,
//   });

//   const createNoteMutation = useCreateNote();
//   const updateNoteMutation = useUpdateNote();
//   const deleteNoteMutation = useDeleteNote();
//   const addTagMutation = useAddTagToNote();
//   const removeTagMutation = useRemoveTagFromNote();
//   const toggleFavoriteMutation = useToggleFavorite();

//   // ==========================================
//   // LOAD EXISTING NOTE (Edit Mode Only)
//   // ==========================================

//   useEffect(() => {
//     if (note && mode === "edit") {
//       dispatch({ type: "LOAD_NOTE", payload: note });
//       setLastSaved(note.updatedAt);
//       // Skip next auto-save to prevent saving immediately after load
//       skipNextAutoSave.current = true;
//     }
//   }, [note, mode]);

//   // ==========================================
//   // AUTO-SAVE
//   // ==========================================

//   const autoSave = useCallback(async () => {
//     // Prevent concurrent saves (race condition fix)
//     if (isSaving.current) {
//       return;
//     }

//     // Skip if flagged (after initial load in edit mode)
//     if (skipNextAutoSave.current) {
//       skipNextAutoSave.current = false;
//       return;
//     }

//     // Don't save if content is empty
//     if (!form.content.trim()) {
//       return;
//     }

//     isSaving.current = true;
//     setSaveStatus("saving");

//     try {
//       // Determine if we're updating or creating
//       const isUpdating = mode === "edit" || createdNoteId;

//       if (isUpdating && (noteId || createdNoteId)) {
//         // UPDATE existing note
//         const idToUpdate = noteId || createdNoteId;
//         if (!idToUpdate) return;

//         await updateNoteMutation.mutateAsync({
//           id: idToUpdate,
//           title: form.title.trim() || "Untitled Note",
//           content: form.content,
//           folderId: form.folderId || null,
//         });

//         setSaveStatus("saved");
//         setLastSaved(new Date());
//       } else {
//         // CREATE new note (first time only)
//         const newNote = await createNoteMutation.mutateAsync({
//           title: form.title.trim() || "Untitled Note",
//           content: form.content,
//           folderId: form.folderId || null,
//           isAutoOrganized: false,
//         });

//         if (newNote?.id) {
//           setCreatedNoteId(newNote.id);
//           setSaveStatus("saved");
//           setLastSaved(new Date());

//           // Add tags to the newly created note
//           for (const tag of form.tags) {
//             try {
//               await addTagMutation.mutateAsync({
//                 noteId: newNote.id,
//                 tagId: tag.id,
//               });
//             } catch (error) {
//               console.error("Failed to add tag:", error);
//             }
//           }

//           // Stay in create mode - no navigation, no mode switch
//         }
//       }
//     } catch (error) {
//       setSaveStatus("error");
//       console.error("Auto-save error:", error);
//     } finally {
//       isSaving.current = false;
//     }
//   }, [
//     mode,
//     form.title,
//     form.content,
//     form.folderId,
//     form.tags,
//     noteId,
//     createdNoteId,
//     createNoteMutation,
//     updateNoteMutation,
//     addTagMutation,
//   ]);

//   const debouncedAutoSave = useDebounce(autoSave, 2000);

//   // Trigger auto-save when form changes
//   useEffect(() => {
//     // Don't auto-save with empty content
//     if (!form.content.trim()) return;

//     debouncedAutoSave();
//   }, [form.title, form.content, form.folderId, debouncedAutoSave]);

//   // ==========================================
//   // HANDLERS
//   // ==========================================

//   const handleTagAdd = async (tag: SimpleTag) => {
//     dispatch({ type: "ADD_TAG", payload: tag });

//     // Only sync to server if note exists
//     const existingNoteId = noteId || createdNoteId;
//     if (existingNoteId) {
//       try {
//         await addTagMutation.mutateAsync({
//           noteId: existingNoteId,
//           tagId: tag.id,
//         });
//       } catch (error) {
//         console.error("Error in handleTagAdd:", error);
//         toast.error("Failed to add tag");
//         dispatch({ type: "REMOVE_TAG", payload: tag.id });
//       }
//     }
//   };

//   const handleTagRemove = async (tagId: string) => {
//     const removedTag = form.tags.find((t) => t.id === tagId);
//     dispatch({ type: "REMOVE_TAG", payload: tagId });

//     const existingNoteId = noteId || createdNoteId;
//     if (existingNoteId) {
//       try {
//         await removeTagMutation.mutateAsync({
//           noteId: existingNoteId,
//           tagId,
//         });
//       } catch (error) {
//         console.error("Error in handleTagRemove:", error);
//         toast.error("Failed to remove tag");
//         if (removedTag) {
//           dispatch({ type: "ADD_TAG", payload: removedTag });
//         }
//       }
//     }
//   };

//   const handleToggleFavorite = async () => {
//     const existingNoteId = noteId || createdNoteId;
//     if (!existingNoteId) return;

//     const previousState = form.isFavorite;
//     dispatch({ type: "TOGGLE_FAVORITE" });

//     try {
//       await toggleFavoriteMutation.mutateAsync(existingNoteId);
//     } catch (error) {
//       console.error("Error in handleToggleFavorite:", error);
//       toast.error("Failed to toggle favorite");
//       // Rollback
//       if (previousState !== form.isFavorite) {
//         dispatch({ type: "TOGGLE_FAVORITE" });
//       }
//     }
//   };

//   const handleDelete = async () => {
//     const existingNoteId = noteId || createdNoteId;
//     if (!existingNoteId) return;

//     try {
//       await deleteNoteMutation.mutateAsync(existingNoteId);
//     } catch (error) {
//       console.error("Error in handleDelete:", error);
//       toast.error("Failed to delete note");
//     }
//   };

//   /**
//    * Manual save
//    * - In create mode: Navigate to edit mode after save
//    * - In edit mode: Just save (already auto-saved)
//    */
//   const handleManualSave = async () => {
//     if (!form.content.trim()) {
//       toast.error("Cannot save empty note");
//       return;
//     }

//     // Wait for any pending auto-save
//     while (isSaving.current) {
//       await new Promise((resolve) => setTimeout(resolve, 100));
//     }

//     await autoSave();

//     // Navigate to edit mode after manual save in create mode
//     const savedNoteId = noteId || createdNoteId;
//     if (mode === "create" && savedNoteId) {
//       toast.success("Note saved");
//       router.push(`/notes/${savedNoteId}`);
//     } else if (mode === "edit") {
//       toast.success("Note saved");
//     }
//   };

//   // ==========================================
//   // LOADING & ERROR STATES
//   // ==========================================

//   if (mode === "edit" && isLoading) {
//     return (
//       <div className="flex h-full items-center justify-center">
//         <div className="text-muted-foreground">Loading note...</div>
//       </div>
//     );
//   }

//   if (mode === "edit" && !note && !isLoading) {
//     return (
//       <div className="flex h-full flex-col items-center justify-center gap-4">
//         <div className="text-2xl font-semibold">Note not found</div>
//       </div>
//     );
//   }

//   // ==========================================
//   // RENDER
//   // ==========================================

//   return (
//     <>
//       <div className="h-full overflow-y-auto">
//         <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
//           <div>
//             <Input
//               type="text"
//               value={form.title}
//               onChange={(e) =>
//                 dispatch({ type: "SET_TITLE", payload: e.target.value })
//               }
//               placeholder="Untitled Note"
//               className="border-0 px-0 text-4xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
//               autoFocus
//             />
//           </div>

//           <Separator />

//           <NoteMetadata
//             folderId={form.folderId}
//             onFolderChange={(id) =>
//               dispatch({ type: "SET_FOLDER", payload: id })
//             }
//             selectedTags={form.tags}
//             onTagAdd={handleTagAdd}
//             onTagRemove={handleTagRemove}
//             saveStatus={saveStatus}
//             lastSaved={lastSaved}
//             onManualSave={handleManualSave}
//             mode={mode}
//             isFavorite={form.isFavorite}
//             onToggleFavorite={handleToggleFavorite}
//             onDelete={() => setShowDeleteConfirm(true)}
//             isDeleting={deleteNoteMutation.isPending}
//             isTogglingFavorite={toggleFavoriteMutation.isPending}
//           />

//           <Separator />
//         </div>

//         <div className="w-full">
//           <SimpleEditor
//             content={form.content}
//             onChange={(content) =>
//               dispatch({ type: "SET_CONTENT", payload: content })
//             }
//             placeholder={EDITOR_TIPS}
//           />
//         </div>
//       </div>

//       {mode === "edit" && (
//         <ConfirmAction
//           open={showDeleteConfirm}
//           onOpenChange={setShowDeleteConfirm}
//           title={`Delete "${form.title || "Untitled Note"}"?`}
//           description="This will permanently delete this note. This action cannot be undone."
//           confirmText="Delete Note"
//           cancelText="Cancel"
//           variant="destructive"
//           loading={deleteNoteMutation.isPending}
//           onConfirm={handleDelete}
//         />
//       )}
//     </>
//   );
// }
"use client";

import { useState, useEffect, useCallback, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ConfirmAction } from "@/components/common/confirm-action";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import { NoteMetadata } from "@/components/notes/note-metadata";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useNoteById,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "@/hooks/use-notes";
import {
  useAddTagToNote,
  useCreateTag,
  useRemoveTagFromNote,
} from "@/hooks/use-tags";
import { useToggleFavorite } from "@/hooks/use-favorites";
import { SimpleTag } from "@/types/noteTypes";
import { SaveStatus } from "@/components/common/auto-save-indicator";
import {
  noteFormReducer,
  getInitialFormState,
} from "@/reducers/note-form-reducer";
import { toast } from "sonner";
import { EDITOR_TIPS } from "@/constants/editor-constants";
import { isTiptapContentEmpty } from "@/lib/tiptap-utils";

interface NoteEditorProps {
  mode: "create" | "edit";
  noteId?: string;
  initialFolderId?: string | null;
}

export function NoteEditor({ mode, noteId, initialFolderId }: NoteEditorProps) {
  const router = useRouter();

  // ==========================================
  // STATE
  // ==========================================

  const [form, dispatch] = useReducer(
    noteFormReducer,
    getInitialFormState(initialFolderId)
  );

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [createdNoteId, setCreatedNoteId] = useState<string | null>(
    noteId || null
  );

  // Refs for tracking state without causing re-renders
  const skipNextAutoSave = useRef(false);
  const isSaving = useRef(false);
  const hasLoadedNote = useRef(false);

  // ==========================================
  // QUERIES & MUTATIONS
  // ==========================================

  // Only fetch note in REAL edit mode (not after creating)
  const { data: note, isLoading } = useNoteById(noteId || "", {
    enabled: mode === "edit" && !!noteId,
  });

  const createNoteMutation = useCreateNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const addTagMutation = useAddTagToNote();
  const removeTagMutation = useRemoveTagFromNote();
  const toggleFavoriteMutation = useToggleFavorite();
  const createTagMutation = useCreateTag();
  // ==========================================
  // LOAD EXISTING NOTE (Edit Mode Only)
  // ==========================================

  useEffect(() => {
    // Only load note data ONCE when first received
    if (note && mode === "edit" && !hasLoadedNote.current) {
      dispatch({ type: "LOAD_NOTE", payload: note });
      setLastSaved(note.updatedAt);
      skipNextAutoSave.current = true;
      hasLoadedNote.current = true; // ← Mark as loaded, never reload again
    }
  }, [note, mode]);

  // ==========================================
  // AUTO-SAVE
  // ==========================================

  const autoSave = useCallback(async () => {
    // Prevent concurrent saves
    if (isSaving.current) {
      return;
    }

    // Skip if flagged (after initial load in edit mode)
    if (skipNextAutoSave.current) {
      skipNextAutoSave.current = false;
      return;
    }

    // Don't save if content is empty (ignoring HTML tags)
    if (isTiptapContentEmpty(form.content)) {
      console.log("⏭️ Skipping auto-save: Content is empty");
      return;
    }

    isSaving.current = true;
    setSaveStatus("saving");

    try {
      // Determine if we're updating or creating
      const isUpdating = mode === "edit" || createdNoteId;

      if (isUpdating && (noteId || createdNoteId)) {
        // UPDATE existing note
        const idToUpdate = noteId || createdNoteId;
        if (!idToUpdate) return;

        await updateNoteMutation.mutateAsync({
          id: idToUpdate,
          title: form.title.trim() || "Untitled Note",
          content: form.content,
          folderId: form.folderId || null,
        });

        setSaveStatus("saved");
        setLastSaved(new Date());
      } else {
        // CREATE new note (first time only)
        const newNote = await createNoteMutation.mutateAsync({
          title: form.title.trim() || "Untitled Note",
          content: form.content,
          folderId: form.folderId || null,
          isAutoOrganized: false,
        });

        if (newNote?.id) {
          setCreatedNoteId(newNote.id);
          setSaveStatus("saved");
          setLastSaved(new Date());

          // Add tags to the newly created note
          for (const tag of form.tags) {
            try {
              await addTagMutation.mutateAsync({
                noteId: newNote.id,
                tagId: tag.id,
              });
            } catch (error) {
              console.error("Failed to add tag:", error);
            }
          }

          // Stay in create mode - no navigation, no mode switch
        }
      }
    } catch (error) {
      setSaveStatus("error");
      console.error("Auto-save error:", error);
    } finally {
      isSaving.current = false;
    }
  }, [
    mode,
    form.title,
    form.content,
    form.folderId,
    form.tags,
    noteId,
    createdNoteId,
    createNoteMutation,
    updateNoteMutation,
    addTagMutation,
  ]);

  const debouncedAutoSave = useDebounce(autoSave, 5000);

  // Trigger auto-save when form changes
  useEffect(() => {
    // Don't auto-save with empty content
    if (isTiptapContentEmpty(form.content)) return;

    debouncedAutoSave();
  }, [form.title, form.content, form.folderId, debouncedAutoSave]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleTagAdd = async (tag: SimpleTag) => {
    const existingNoteId = noteId || createdNoteId;

    let tagToAdd = tag;

    // ⭐ If this is a new tag (temp ID), create it first
    if (tag.id.startsWith("temp-")) {
      try {
        const newTag = await createTagMutation.mutateAsync({
          name: tag.name,
        });

        tagToAdd = {
          id: newTag.id,
          name: newTag.name,
        };
      } catch (error) {
        console.error("Failed to create tag:", error);
        toast.error("Failed to create tag");
        return; // Don't add to local state if creation failed
      }
    }

    // Add to local state
    dispatch({ type: "ADD_TAG", payload: tagToAdd });

    // Sync to server if note exists
    if (existingNoteId) {
      try {
        await addTagMutation.mutateAsync({
          noteId: existingNoteId,
          tagId: tagToAdd.id, // ⭐ Now using real ID
        });
      } catch (error) {
        console.error("Failed to add tag to note:", error);
        toast.error("Failed to add tag");
        // Rollback
        dispatch({ type: "REMOVE_TAG", payload: tagToAdd.id });
      }
    }
  };

  const handleTagRemove = async (tagId: string) => {
    const removedTag = form.tags.find((t) => t.id === tagId);
    dispatch({ type: "REMOVE_TAG", payload: tagId });

    const existingNoteId = noteId || createdNoteId;
    if (existingNoteId) {
      try {
        await removeTagMutation.mutateAsync({
          noteId: existingNoteId,
          tagId,
        });
      } catch (error) {
        console.error("Error in handleTagRemove:", error);
        toast.error("Failed to remove tag");
        if (removedTag) {
          dispatch({ type: "ADD_TAG", payload: removedTag });
        }
      }
    }
  };

  const handleToggleFavorite = async () => {
    const existingNoteId = noteId || createdNoteId;
    if (!existingNoteId) return;

    const previousState = form.isFavorite;
    dispatch({ type: "TOGGLE_FAVORITE" });

    try {
      await toggleFavoriteMutation.mutateAsync(existingNoteId);
    } catch (error) {
      console.error("Error in handleToggleFavorite:", error);
      toast.error("Failed to toggle favorite");
      // Rollback
      if (previousState !== form.isFavorite) {
        dispatch({ type: "TOGGLE_FAVORITE" });
      }
    }
  };

  const handleDelete = async () => {
    const existingNoteId = noteId || createdNoteId;
    if (!existingNoteId) return;

    try {
      await deleteNoteMutation.mutateAsync(existingNoteId);
    } catch (error) {
      console.error("Error in handleDelete:", error);
      toast.error("Failed to delete note");
    }
  };

  /**
   * Manual save
   * - In create mode: Navigate to edit mode after save
   * - In edit mode: Just save (already auto-saved)
   */
  const handleManualSave = async () => {
    if (isTiptapContentEmpty(form.content)) {
      toast.error("Cannot save empty note", {
        description: "Please add some content before saving.",
      });
      return;
    }

    // Wait for any pending auto-save
    while (isSaving.current) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await autoSave();

    // Navigate to edit mode after manual save in create mode
    const savedNoteId = noteId || createdNoteId;
    if (mode === "create" && savedNoteId) {
      toast.success("Note saved");
      router.push(`/notes/${savedNoteId}`);
    } else if (mode === "edit") {
      toast.success("Note saved");
    }
  };

  // ==========================================
  // LOADING & ERROR STATES
  // ==========================================

  if (mode === "edit" && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading note...</div>
      </div>
    );
  }

  if (mode === "edit" && !note && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <div className="text-2xl font-semibold">Note not found</div>
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <div className="h-full overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
          <div>
            <Input
              type="text"
              value={form.title}
              onChange={(e) =>
                dispatch({ type: "SET_TITLE", payload: e.target.value })
              }
              placeholder="Untitled Note"
              className="border-0 px-0 text-4xl font-bold focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          <Separator />

          <NoteMetadata
            folderId={form.folderId}
            onFolderChange={(id) =>
              dispatch({ type: "SET_FOLDER", payload: id })
            }
            selectedTags={form.tags}
            onTagAdd={handleTagAdd}
            onTagRemove={handleTagRemove}
            saveStatus={saveStatus}
            lastSaved={lastSaved}
            onManualSave={handleManualSave}
            mode={mode}
            isFavorite={form.isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onDelete={() => setShowDeleteConfirm(true)}
            isDeleting={deleteNoteMutation.isPending}
            isTogglingFavorite={toggleFavoriteMutation.isPending}
          />

          <Separator />
        </div>

        <div className="w-full">
          <SimpleEditor
            content={form.content}
            onChange={(content) =>
              dispatch({ type: "SET_CONTENT", payload: content })
            }
            placeholder={EDITOR_TIPS}
          />
        </div>
      </div>

      {mode === "edit" && (
        <ConfirmAction
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={`Delete "${form.title || "Untitled Note"}"?`}
          description="This will permanently delete this note. This action cannot be undone."
          confirmText="Delete Note"
          cancelText="Cancel"
          variant="destructive"
          loading={deleteNoteMutation.isPending}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}
