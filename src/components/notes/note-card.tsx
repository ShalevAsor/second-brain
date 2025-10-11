// src/components/notes/note-card.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { FileText, Folder } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FavoriteButton } from "@/components/common/favorite-button";
import { type NoteWithRelations, getNoteTags } from "@/types/noteTypes";
import { getFolderColorClass } from "../common/color-picker";

interface NoteCardProps {
  note: NoteWithRelations;
}

/**
 * Reusable note card component
 * Used in: All notes view, folder view, tag view, favorites view, search results
 */
export function NoteCard({ note }: NoteCardProps) {
  const tags = getNoteTags(note);

  // Extract plain text from HTML content for preview (first ~150 chars)
  const contentPreview = extractTextPreview(note.content, 150);

  // Format timestamp
  const timeAgo = formatDistanceToNow(new Date(note.updatedAt), {
    addSuffix: true,
  });

  return (
    <Link
      href={`/notes/${note.id}`}
      className={cn(
        "group relative block rounded-lg border bg-card p-4 transition-all hover:shadow-md",
        "hover:border-primary/50"
      )}
    >
      {/* Header: Title + Favorite Button */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <h3 className="font-semibold text-base line-clamp-2 break-words">
            {note.title || "Untitled Note"}
          </h3>
        </div>

        {/* Favorite Star */}
        <div className="shrink-0" onClick={(e) => e.preventDefault()}>
          <FavoriteButton noteId={note.id} isFavorite={note.isFavorite} />
        </div>
      </div>

      {/* Metadata: Folder + Time */}
      <div className="mb-3 flex items-center gap-3 text-sm text-muted-foreground">
        {/* Folder */}
        {note.folder ? (
          <div className="flex items-center gap-1.5">
            <Folder
              className={cn(
                "h-3.5 w-3.5",
                getFolderColorClass(note.folder.color)
              )}
            />
            <span className="truncate">{note.folder.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">Inbox</span>
          </div>
        )}

        {/* Separator */}
        <span className="text-muted-foreground/50">•</span>

        {/* Time */}
        <time className="truncate" dateTime={note.updatedAt.toISOString()}>
          {timeAgo}
        </time>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Content Preview */}
      {contentPreview && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {contentPreview}
        </p>
      )}

      {/* Hover effect indicator */}
      <div className="absolute inset-0 rounded-lg border-2 border-primary opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
    </Link>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract plain text from HTML content for preview
 * Strips HTML tags and limits to maxLength characters
 */
function extractTextPreview(htmlContent: string, maxLength: number): string {
  if (!htmlContent) return "";

  // Remove HTML tags
  const text = htmlContent.replace(/<[^>]*>/g, " ");

  // Decode HTML entities
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  const decoded = textarea.value;

  // Clean up whitespace
  const cleaned = decoded.replace(/\s+/g, " ").trim();

  // Truncate
  if (cleaned.length <= maxLength) return cleaned;

  return cleaned.slice(0, maxLength).trim() + "...";
}
