// src/components/notes/quick-capture.tsx
"use client";

import { Sparkles } from "lucide-react";

export function QuickCapture() {
  return (
    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">⚡ Quick Capture</h3>
        <p className="text-sm text-muted-foreground">
          Paste anything here and AI will auto-organize it in 5 seconds
        </p>
      </div>
    </div>
  );
}
