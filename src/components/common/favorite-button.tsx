"use client";

import { Star } from "lucide-react";
import { useToggleFavorite } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Favorite Button Component
 *
 * Toggles the favorite status of a note.
 *
 * Features:
 * - Filled star when favorited
 * - Hollow star when not favorited
 * - Hover effect
 * - Loading state (disabled while saving)
 * - Tooltip showing action
 * - Prevents event propagation (so clicking doesn't trigger parent links)
 * - Optimistic updates via React Query
 *
 * @param noteId - The ID of the note to favorite/unfavorite
 * @param isFavorite - Current favorite status
 * @param showTooltip - Whether to show tooltip (default: true)
 * @param variant - Button variant (default: "ghost")
 * @param size - Button size (default: "icon")
 *
 * @example
 * <FavoriteButton noteId={note.id} isFavorite={note.isFavorite} />
 */
interface FavoriteButtonProps {
  noteId: string;
  isFavorite: boolean;
  showTooltip?: boolean;
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FavoriteButton({
  noteId,
  isFavorite,
  showTooltip = true,
  variant = "ghost",
  size = "icon",
  className,
}: FavoriteButtonProps) {
  const toggleFavorite = useToggleFavorite();

  /**
   * Handle click event
   * Prevents event propagation so parent elements (like links) don't trigger
   */
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation(); // Stop event from bubbling up
    toggleFavorite.mutate(noteId);
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star
        className={`h-4 w-4 transition-colors ${
          isFavorite
            ? "fill-yellow-400 text-yellow-400" // Filled star
            : "text-muted-foreground hover:text-yellow-400" // Hollow star
        }`}
      />
    </Button>
  );

  // Return with or without tooltip based on prop
  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
