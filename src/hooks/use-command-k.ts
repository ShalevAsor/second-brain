// src/hooks/use-command-k.ts
"use client";

import { useEffect } from "react";
import { useModalStore } from "@/stores/modalStore";

/**
 * Global keyboard shortcut hook for Cmd+K / Ctrl+K
 * Opens the search modal when triggered
 */
export function useCommandK() {
  const { onOpen } = useModalStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen("search");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
