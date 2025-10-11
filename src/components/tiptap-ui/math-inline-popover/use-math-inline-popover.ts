"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

/**
 * Configuration for the math popover functionality
 */
export interface UseMathInlinePopoverConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;
  /**
   * Whether to hide the math popover when not available.
   * @default false
   */
  hideWhenUnavailable?: boolean;
  /**
   * Callback function called when the math formula is inserted.
   */
  onInsertMath?: () => void;
}

/**
 * Configuration for the math handler functionality
 */
export interface MathInlineHandlerProps {
  /**
   * The Tiptap editor instance.
   */
  editor: Editor | null;
  /**
   * Callback function called when the math formula is inserted.
   */
  onInsertMath?: () => void;
}

/**
 * Checks if inline math can be inserted in the current editor state
 */
export function canInsertInlineMath(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;
  // Just check if editor is editable - the command will handle the rest
  return true;
}

/**
 * Checks if inline math is currently active in the editor
 */
export function isInlineMathActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;

  // Simply check if inlineMath is active
  // The Mathematics extension should handle this correctly
  return editor.isActive("inlineMath");
}

/**
 * Determines if the math button should be shown
 */
export function shouldShowMathInlineButton(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = props;

  if (!editor) {
    return false;
  }

  // Check if Mathematics extension is loaded (check for both possible names)
  const hasMathExtension = editor.extensionManager.extensions.some((ext) => {
    const name = ext.name.toLowerCase();
    return (
      name === "mathematics" || name === "inlinemath" || name === "blockmath"
    );
  });

  if (!hasMathExtension) {
    return false;
  }

  if (hideWhenUnavailable) {
    return canInsertInlineMath(editor);
  }

  return true;
}

/**
 * Custom hook for handling inline math operations in a Tiptap editor
 */
export function useMathInlineHandler(props: MathInlineHandlerProps) {
  const { editor, onInsertMath } = props;
  const [latex, setLatex] = React.useState<string>("");

  React.useEffect(() => {
    if (!editor) return;

    // Get latex immediately on mount if inline math is active
    if (isInlineMathActive(editor)) {
      const attrs = editor.getAttributes("inlineMath");
      setLatex(attrs.latex || "");
    }
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;

    const updateMathState = () => {
      if (isInlineMathActive(editor)) {
        const attrs = editor.getAttributes("inlineMath");
        setLatex(attrs.latex || "");
      } else {
        // Clear latex when formula is no longer active
        setLatex("");
      }
    };

    editor.on("selectionUpdate", updateMathState);
    return () => {
      editor.off("selectionUpdate", updateMathState);
    };
  }, [editor]);

  const insertMath = React.useCallback(() => {
    if (!latex || !editor) return;

    const isActive = isInlineMathActive(editor);

    if (isActive) {
      // Update existing inline math
      editor.chain().focus().updateInlineMath({ latex }).run();
    } else {
      // Insert new inline math
      editor.chain().focus().insertInlineMath({ latex }).run();
    }

    setLatex("");
    onInsertMath?.();
  }, [editor, latex, onInsertMath]);

  const deleteMath = React.useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteInlineMath().run();
    setLatex("");
  }, [editor]);

  return {
    latex,
    setLatex,
    insertMath,
    deleteMath,
  };
}

/**
 * Custom hook for math popover state management
 */
export function useMathInlineState(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}) {
  const { editor, hideWhenUnavailable = false } = props;

  const canInsert = canInsertInlineMath(editor);
  const isActive = isInlineMathActive(editor);

  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowMathInlineButton({
          editor,
          hideWhenUnavailable,
        })
      );
    };

    handleSelectionUpdate();

    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, hideWhenUnavailable]);

  return {
    isVisible,
    canInsert,
    isActive,
  };
}

/**
 * Main hook that provides inline math popover functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * function MyMathButton() {
 *   const { isVisible, canInsert, isActive, latex, setLatex, insertMath } = useMathPopover()
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <div>
 *       <input value={latex} onChange={(e) => setLatex(e.target.value)} />
 *       <button onClick={insertMath}>Insert</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useMathInlinePopover(config?: UseMathInlinePopoverConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInsertMath,
  } = config || {};

  const { editor } = useTiptapEditor(providedEditor);

  const { isVisible, canInsert, isActive } = useMathInlineState({
    editor,
    hideWhenUnavailable,
  });

  const mathHandler = useMathInlineHandler({
    editor,
    onInsertMath,
  });

  return {
    isVisible,
    canInsert,
    isActive,
    ...mathHandler,
  };
}
