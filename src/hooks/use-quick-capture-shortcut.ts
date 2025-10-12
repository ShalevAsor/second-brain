"use client";

import { useEffect } from "react";
import { useModalStore } from "@/stores/modalStore";

/**
 * Global keyboard shortcut for Quick Capture
 * Opens Quick Capture modal when Cmd+Shift+C or Ctrl+Shift+C is pressed
 *
 * Usage: Call this hook in KeyboardShortcutProvider to enable globally
 */
export function useQuickCaptureShortcut() {
  const { onOpen } = useModalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+Shift+C (Mac) or Ctrl+Shift+C (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        onOpen("quickCapture");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpen]);
}
