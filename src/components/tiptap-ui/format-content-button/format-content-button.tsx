"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

// --- Lib ---
import { parseShortcutKeys } from "@/lib/tiptap-utils";

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";

// --- Tiptap UI ---
import type { UseFormatContentConfig } from "./use-format-content";
import {
  useFormatContent,
  FORMAT_CONTENT_SHORTCUT_KEY,
} from "./use-format-content";

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button";
import { Button } from "@/components/tiptap-ui-primitive/button";
import { Badge } from "@/components/tiptap-ui-primitive/badge";

export interface FormatContentButtonProps
  extends Omit<ButtonProps, "type">,
    UseFormatContentConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string;
  /**
   * Optional show shortcut keys in the button.
   * @default false
   */
  showShortcut?: boolean;
}

export function FormatContentShortcutBadge({
  shortcutKeys = FORMAT_CONTENT_SHORTCUT_KEY,
}: {
  shortcutKeys?: string;
}) {
  return <Badge>{parseShortcutKeys({ shortcutKeys })}</Badge>;
}

/**
 * Button component for formatting content with AI in a Tiptap editor.
 *
 * For custom button implementations, use the `useFormatContent` hook instead.
 */
export const FormatContentButton = React.forwardRef<
  HTMLButtonElement,
  FormatContentButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onFormatStart,
      onFormatSuccess,
      onFormatError,
      showShortcut = false,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor);
    const {
      isVisible,
      isFormatting,
      canFormat,
      handleFormatContent,
      label,
      shortcutKeys,
      Icon,
    } = useFormatContent({
      editor,
      label: text || "Format content with AI",
      hideWhenUnavailable,
      onFormatStart,
      onFormatSuccess,
      onFormatError,
    });

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        handleFormatContent();
      },
      [handleFormatContent, onClick]
    );

    if (!isVisible) {
      return null;
    }

    return (
      <Button
        type="button"
        data-style="ghost"
        role="button"
        tabIndex={-1}
        disabled={!canFormat || isFormatting}
        data-disabled={!canFormat || isFormatting}
        aria-label={label}
        tooltip={label}
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            {isFormatting ? (
              <Loader2 className="tiptap-button-icon animate-spin" />
            ) : (
              <Icon className="tiptap-button-icon" />
            )}
            {text && <span className="tiptap-button-text">{text}</span>}
            {showShortcut && !isFormatting && (
              <FormatContentShortcutBadge shortcutKeys={shortcutKeys} />
            )}
          </>
        )}
      </Button>
    );
  }
);

FormatContentButton.displayName = "FormatContentButton";
