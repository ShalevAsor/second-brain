"use client";

import { Check, Loader2, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date;
  errorMessage?: string;
  className?: string;
}

/**
 * AutoSaveIndicator - Display auto-save status
 *
 * Shows:
 * - "Saving..." with spinner (saving)
 * - "Saved" with checkmark + timestamp (saved)
 * - Nothing (idle)
 * - "Error saving" with alert icon (error)
 *
 * Used in:
 * - Note Editor (auto-save notes)
 * - Any form with auto-save functionality
 */
export function AutoSaveIndicator({
  status,
  lastSaved,
  errorMessage,
  className,
}: AutoSaveIndicatorProps) {
  // Don't render anything in idle state
  if (status === "idle") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm transition-opacity duration-200",
        className
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Saving State */}
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}

      {/* Saved State */}
      {status === "saved" && (
        <>
          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-green-600 dark:text-green-500">Saved</span>
            {lastSaved && (
              <>
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {formatDistanceToNow(lastSaved, { addSuffix: true })}
                </span>
              </>
            )}
          </div>
        </>
      )}

      {/* Error State */}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">
            {errorMessage || "Error saving"}
          </span>
        </>
      )}
    </div>
  );
}
