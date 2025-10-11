"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

/**
 * Configuration for the block math popover functionality
 */
export interface UseMathBlockPopoverConfig {
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
 * Configuration for the block math handler functionality
 */
export interface MathBlockHandlerProps {
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
 * Checks if block math can be inserted in the current editor state
 */
export function canInsertBlockMath(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;
  return true;
}

/**
 * Checks if block math is currently active in the editor
 */
export function isBlockMathActive(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;
  return editor.isActive("blockMath");
}

/**
 * Determines if the block math button should be shown
 */
export function shouldShowMathBlockButton(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = props;

  if (!editor) {
    return false;
  }

  // Check if Mathematics extension is loaded
  const hasMathExtension = editor.extensionManager.extensions.some((ext) => {
    const name = ext.name.toLowerCase();
    return (
      name === "mathematics" || name === "blockmath" || name === "inlinemath"
    );
  });

  if (!hasMathExtension) {
    return false;
  }

  if (hideWhenUnavailable) {
    return canInsertBlockMath(editor);
  }

  return true;
}

/**
 * Custom hook for handling block math operations in a Tiptap editor
 */
export function useMathBlockHandler(props: MathBlockHandlerProps) {
  const { editor, onInsertMath } = props;
  const [latex, setLatex] = React.useState<string>("");

  React.useEffect(() => {
    if (!editor) return;

    // Get latex immediately on mount if block math is active
    if (isBlockMathActive(editor)) {
      const attrs = editor.getAttributes("blockMath");
      setLatex(attrs.latex || "");
    }
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;

    const updateMathState = () => {
      if (isBlockMathActive(editor)) {
        const attrs = editor.getAttributes("blockMath");
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

    const isActive = isBlockMathActive(editor);

    if (isActive) {
      // Update existing block math
      editor.chain().focus().updateBlockMath({ latex }).run();
    } else {
      // Insert new block math
      editor.chain().focus().insertBlockMath({ latex }).run();
    }

    setLatex("");
    onInsertMath?.();
  }, [editor, latex, onInsertMath]);

  const deleteMath = React.useCallback(() => {
    if (!editor) return;
    editor.chain().focus().deleteBlockMath().run();
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
 * Custom hook for block math popover state management
 */
export function useMathBlockState(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}) {
  const { editor, hideWhenUnavailable = false } = props;

  const canInsert = canInsertBlockMath(editor);
  const isActive = isBlockMathActive(editor);

  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      setIsVisible(
        shouldShowMathBlockButton({
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
 * Main hook that provides block math popover functionality for Tiptap editor
 */
export function useMathBlockPopover(config?: UseMathBlockPopoverConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInsertMath,
  } = config || {};

  const { editor } = useTiptapEditor(providedEditor);

  const { isVisible, canInsert, isActive } = useMathBlockState({
    editor,
    hideWhenUnavailable,
  });

  const mathHandler = useMathBlockHandler({
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
