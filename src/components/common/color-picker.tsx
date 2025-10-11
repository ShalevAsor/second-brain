"use client";

import * as React from "react";
import { FolderColor } from "@prisma/client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Color Configuration
 * Maps folder colors to Tailwind classes and display information
 */
const COLOR_CONFIG: Record<
  FolderColor,
  {
    bg: string; // Background color class
    border: string; // Border color class (for selected state)
    label: string; // Human-readable label
  }
> = {
  [FolderColor.GRAY]: {
    bg: "bg-gray-500",
    border: "border-gray-500",
    label: "Gray",
  },
  [FolderColor.RED]: {
    bg: "bg-red-500",
    border: "border-red-500",
    label: "Red",
  },
  [FolderColor.GREEN]: {
    bg: "bg-green-500",
    border: "border-green-500",
    label: "Green",
  },
  [FolderColor.BLUE]: {
    bg: "bg-blue-500",
    border: "border-blue-500",
    label: "Blue",
  },
  [FolderColor.YELLOW]: {
    bg: "bg-yellow-500",
    border: "border-yellow-500",
    label: "Yellow",
  },
  [FolderColor.PURPLE]: {
    bg: "bg-purple-500",
    border: "border-purple-500",
    label: "Purple",
  },
};

/**
 * Color order for display
 * Defines the visual arrangement of color options
 */
const COLOR_ORDER: FolderColor[] = [
  FolderColor.GRAY,
  FolderColor.RED,
  FolderColor.GREEN,
  FolderColor.BLUE,
  FolderColor.YELLOW,
  FolderColor.PURPLE,
];

/**
 * ColorPicker Component Props
 */
interface ColorPickerProps {
  /**
   * Currently selected color
   */
  value: FolderColor;

  /**
   * Callback fired when color is selected
   */
  onChange: (color: FolderColor) => void;

  /**
   * Whether the color picker is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ColorPicker Component
 *
 * A simple, accessible color picker for folder colors.
 * Displays 6 color options in circular buttons with visual feedback.
 *
 * Features:
 * - Keyboard accessible
 * - Visual selected state (checkmark)
 * - Hover effects
 * - Disabled state
 * - ARIA labels for screen readers
 *
 * @example
 * ```tsx
 * <ColorPicker
 *   value={color}
 *   onChange={setColor}
 * />
 * ```
 */
export function ColorPicker({
  value,
  onChange,
  disabled = false,
  className,
}: ColorPickerProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} role="radiogroup">
      {COLOR_ORDER.map((color) => {
        const config = COLOR_CONFIG[color];
        const isSelected = value === color;

        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Select ${config.label} color`}
            disabled={disabled}
            onClick={() => onChange(color)}
            className={cn(
              // Base styles
              "relative h-8 w-8 rounded-full transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

              // Color
              config.bg,

              // Border (appears when selected)
              "border-2",
              isSelected ? config.border : "border-transparent",

              // Hover effect (slight scale)
              !disabled && "hover:scale-110",

              // Disabled state
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {/* Checkmark for selected color */}
            {isSelected && (
              <Check
                className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md"
                strokeWidth={3}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Get color configuration for a given folder color
 * Useful for displaying folder colors in other components
 *
 * @example
 * ```tsx
 * const config = getColorConfig(folder.color);
 * <FolderIcon className={config.text} />
 * ```
 */
export function getColorConfig(color: FolderColor) {
  return COLOR_CONFIG[color];
}

/**
 * Get Tailwind text color class for a folder color
 * Used to color folder icons in the sidebar
 *
 * @example
 * ```tsx
 * <FolderIcon className={getFolderColorClass(folder.color)} />
 * ```
 */
export function getFolderColorClass(color: FolderColor): string {
  const colorMap: Record<FolderColor, string> = {
    [FolderColor.GRAY]: "text-gray-500",
    [FolderColor.RED]: "text-red-500",
    [FolderColor.GREEN]: "text-green-500",
    [FolderColor.BLUE]: "text-blue-500",
    [FolderColor.YELLOW]: "text-yellow-500",
    [FolderColor.PURPLE]: "text-purple-500",
  };

  return colorMap[color];
}
