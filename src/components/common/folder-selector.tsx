"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFolders } from "@/hooks/use-folders";
import { Loader2 } from "lucide-react";
import type { FolderOption } from "@/types/folderTypes";

interface FolderSelectorProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
  disabled?: boolean;

  // Filtering options
  excludeFolderIds?: string[]; // Folders to hide (e.g., current folder in edit)
  excludeInbox?: boolean; // Hide Inbox/default folders

  // UI customization
  placeholder?: string;
  label?: string;
  helperText?: string;
  showNoneOption?: boolean; // Show "None" option
  noneOptionLabel?: string; // Custom label for "None"
  required?: boolean; // Show asterisk on label
  className?: string;
}

/**
 * Build hierarchical folder list with proper sorting
 * Uses the depth field from database (no calculation needed!)
 */
function buildHierarchicalFolders(folders: FolderOption[]): FolderOption[] {
  return [...folders].sort((a, b) => {
    // Sort by depth first (0, 1, 2)
    if (a.depth !== b.depth) return a.depth - b.depth;
    // Then alphabetically within same depth
    return a.name.localeCompare(b.name);
  });
}

/**
 * Render folder option with clear visual hierarchy
 * Different icons and indentation for each depth level
 */
function renderFolderOption(folder: FolderOption): string {
  switch (folder.depth) {
    case 0:
      // Root folders: Just icon and name
      return `📁 ${folder.name}`;
    case 1:
      // First level: Indent + branch connector + different icon
      return `  ├─ 📂 ${folder.name}`;
    case 2:
      // Second level: More indent + end connector + document icon
      return `    └─ 📄 ${folder.name}`;
    default:
      // Fallback (shouldn't happen with max depth 2)
      return `📁 ${folder.name}`;
  }
}

/**
 * FolderSelector - Reusable hierarchical folder selector
 *
 * Used in:
 * - FolderModal (parent selection)
 * - Note Editor (folder selection for notes)
 * - Quick Capture (folder suggestion)
 *
 * Features:
 * - Hierarchical display with visual indicators
 * - Optional "None" option
 * - Filter by exclusions (Inbox, specific folders)
 * - Loading state
 * - Fully customizable labels and helper text
 */
export function FolderSelector({
  value,
  onChange,
  disabled = false,
  excludeFolderIds = [],
  excludeInbox = false,
  placeholder = "Select folder...",
  label,
  helperText,
  showNoneOption = true,
  noneOptionLabel = "None",
  required = false,
  className,
}: FolderSelectorProps) {
  // Fetch all folders
  const { data: folders, isLoading } = useFolders();

  /**
   * Filter and sort folders based on props
   */
  const getFilteredFolders = (): FolderOption[] => {
    if (!folders) return [];

    let filtered = [...folders];

    // Exclude Inbox/default folders if requested
    if (excludeInbox) {
      filtered = filtered.filter((f) => !f.isDefault);
    }

    // Exclude specific folders (e.g., current folder in edit mode)
    if (excludeFolderIds.length > 0) {
      filtered = filtered.filter((f) => !excludeFolderIds.includes(f.id));
    }

    // Build hierarchical structure with depth sorting
    return buildHierarchicalFolders(filtered);
  };

  const filteredFolders = getFilteredFolders();

  /**
   * Handle folder selection
   */
  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === "none") {
      onChange(null);
    } else {
      onChange(selectedValue);
    }
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <Label htmlFor="folder-selector" className="mb-2 block">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {/* Select Component */}
      <Select
        value={value || "none"}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="folder-selector">
          <SelectValue placeholder={placeholder}>
            {isLoading ? (
              <span className="flex items-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading folders...
              </span>
            ) : value ? (
              // Show selected folder with hierarchy
              folders?.find((f) => f.id === value) ? (
                renderFolderOption(folders.find((f) => f.id === value)!)
              ) : (
                placeholder
              )
            ) : (
              placeholder
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {/* None Option */}
          {showNoneOption && (
            <SelectItem value="none">{noneOptionLabel}</SelectItem>
          )}

          {/* Folder List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading folders...
            </div>
          ) : filteredFolders.length > 0 ? (
            filteredFolders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {renderFolderOption(folder)}
              </SelectItem>
            ))
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {excludeInbox
                ? "No folders available (create a root folder first)"
                : "No folders yet"}
            </div>
          )}
        </SelectContent>
      </Select>

      {/* Helper Text */}
      {helperText && (
        <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
