import { SimpleTag } from "@/types/noteTypes";
import type { NoteWithRelations } from "@/types/noteTypes";

/**
 * Form State
 * Represents all the editable fields of a note
 */
export interface NoteFormState {
  title: string;
  content: string;
  folderId: string | null;
  tags: SimpleTag[];
  isFavorite: boolean;
}

/**
 * Form Actions
 * All possible ways to update the form state
 */
export type NoteFormAction =
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_CONTENT"; payload: string }
  | { type: "SET_FOLDER"; payload: string | null }
  | { type: "ADD_TAG"; payload: SimpleTag }
  | { type: "REMOVE_TAG"; payload: string } // tagId
  | { type: "TOGGLE_FAVORITE" }
  | { type: "LOAD_NOTE"; payload: NoteWithRelations } // For edit mode
  | { type: "RESET" }; // Reset to initial state

/**
 * Initial State Factory
 * Creates initial state based on mode
 */
export function getInitialFormState(
  initialFolderId?: string | null
): NoteFormState {
  return {
    title: "Untitled Note",
    content: "",
    folderId: initialFolderId || null,
    tags: [],
    isFavorite: false,
  };
}
/**
 * Form Reducer
 * Handles all form state updates
 */
export function noteFormReducer(
  state: NoteFormState,
  action: NoteFormAction
): NoteFormState {
  switch (action.type) {
    case "SET_TITLE":
      return {
        ...state,
        title: action.payload,
      };

    case "SET_CONTENT":
      return {
        ...state,
        content: action.payload,
      };

    case "SET_FOLDER":
      return {
        ...state,
        folderId: action.payload,
      };

    case "ADD_TAG":
      // Prevent duplicates
      if (state.tags.some((tag) => tag.id === action.payload.id)) {
        return state;
      }
      return {
        ...state,
        tags: [...state.tags, action.payload],
      };

    case "REMOVE_TAG":
      return {
        ...state,
        tags: state.tags.filter((tag) => tag.id !== action.payload),
      };

    case "TOGGLE_FAVORITE":
      return {
        ...state,
        isFavorite: !state.isFavorite,
      };

    case "LOAD_NOTE":
      // Load existing note data (for edit mode)
      return {
        title: action.payload.title,
        content: action.payload.content,
        folderId: action.payload.folderId,
        tags: action.payload.tags.map((noteTag) => ({
          id: noteTag.tag.id,
          name: noteTag.tag.name,
        })),
        isFavorite: action.payload.isFavorite,
      };

    case "RESET":
      return getInitialFormState("create");

    default:
      return state;
  }
}
