// src/components/providers/KeyboardShortcutProvider.tsx
"use client";

import { useCommandK } from "@/hooks/use-command-k";
import { useQuickCaptureShortcut } from "@/hooks/use-quick-capture-shortcut";

export function KeyboardShortcutProvider() {
  useCommandK();
  useQuickCaptureShortcut();
  return null;
}
