"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Actions ---
import { formatContentAction } from "@/actions/aiActions";

// --- Toast ---
import { toast } from "sonner";

// --- Icons ---
import { Sparkles } from "lucide-react";

export const FORMAT_CONTENT_SHORTCUT_KEY = "mod+shift+f";

/**
 * Configuration for the format content functionality
 */
export interface UseFormatContentConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null;

  /**
   * Optional label to display alongside the icon.
   */
  label?: string;

  /**
   * Whether the button should hide when unavailable.
   * @default false
   */
  hideWhenUnavailable?: boolean;

  /**
   * Called when formatting starts.
   */
  onFormatStart?: () => void;

  /**
   * Called when formatting completes successfully.
   */
  onFormatSuccess?: (formattedContent: string) => void;

  /**
   * Called when formatting fails.
   */
  onFormatError?: (error: string) => void;
}

/**
 * Check if content can be formatted
 */
export function canFormatContent(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false;

  const content = editor.getText();

  // Must have content
  if (!content.trim()) return false;

  // Must be under 10k characters
  if (content.length > 10000) return false;

  return true;
}

/**
 * Check if button should be visible
 */
export function shouldShowButton(props: {
  editor: Editor | null;
  hideWhenUnavailable: boolean;
}): boolean {
  const { editor, hideWhenUnavailable } = props;

  if (!editor || !editor.isEditable) return false;

  if (hideWhenUnavailable) {
    return canFormatContent(editor);
  }

  return true;
}

/**
 * Hook for format content functionality
 */
export function useFormatContent(config: UseFormatContentConfig) {
  const {
    editor: providedEditor,
    label,
    hideWhenUnavailable = false,
    onFormatStart,
    onFormatSuccess,
    onFormatError,
  } = config;

  const { editor } = useTiptapEditor(providedEditor);
  const [isVisible, setIsVisible] = React.useState<boolean>(true);
  const [isFormatting, setIsFormatting] = React.useState<boolean>(false);
  const canFormat = canFormatContent(editor);

  // Update visibility on selection change
  React.useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }));
    };

    handleUpdate();

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor, hideWhenUnavailable]);

  /**
   * Handle format content action
   */
  const handleFormatContent = React.useCallback(async () => {
    if (!editor || !canFormat || isFormatting) return false;

    const content = editor.getHTML();
    const textContent = editor.getText();

    // Validate length
    if (textContent.length > 10000) {
      const error = "Content too long to format (max 10k characters)";
      toast.error(error);
      onFormatError?.(error);
      return false;
    }

    // Validate not empty
    if (!textContent.trim()) {
      const error = "No content to format";
      toast.error(error);
      onFormatError?.(error);
      return false;
    }

    setIsFormatting(true);
    onFormatStart?.();

    try {
      console.log("🎨 [Format Button] Formatting content...");
      console.log("   Length:", textContent.length, "characters");

      // Call server action
      const result = await formatContentAction(textContent);

      if (!result.success) {
        throw new Error(result.error || "Formatting failed");
      }

      if (!result.data.wasFormatted) {
        const error = result.data.error || "Content could not be formatted";
        toast.error(error);
        onFormatError?.(error);
        return false;
      }

      // Update editor content
      editor.commands.setContent(result.data.formattedContent);

      console.log("✅ [Format Button] Content formatted successfully");
      toast.success("Content formatted!");
      onFormatSuccess?.(result.data.formattedContent);

      return true;
    } catch (error) {
      console.error("❌ [Format Button] Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Formatting failed";
      toast.error(errorMessage);
      onFormatError?.(errorMessage);
      return false;
    } finally {
      setIsFormatting(false);
    }
  }, [
    editor,
    canFormat,
    isFormatting,
    onFormatStart,
    onFormatSuccess,
    onFormatError,
  ]);

  return {
    isVisible,
    isFormatting,
    canFormat,
    handleFormatContent,
    label: label || "Format content with AI",
    shortcutKeys: FORMAT_CONTENT_SHORTCUT_KEY,
    Icon: Sparkles,
  };
}
