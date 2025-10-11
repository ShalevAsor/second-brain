"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { X, Tag as TagIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SimpleTag } from "@/types/noteTypes";
import { useTags } from "@/hooks/use-tags";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  selectedTags: SimpleTag[];
  onTagAdd: (tag: SimpleTag) => void;
  onTagRemove: (tagId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * TagInput - Reusable autocomplete tag input component
 *
 * Features:
 * - Autocomplete with existing tags
 * - Create new tags inline (press Enter)
 * - Keyboard navigation (arrows, Enter, Escape)
 * - Click outside to close
 * - Accessible (ARIA labels)
 */
export function TagInput({
  selectedTags,
  onTagAdd,
  onTagRemove,
  placeholder = "Add tags...",
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch all available tags
  const { data: allTags, isLoading } = useTags();

  // Filter tags based on input and exclude already selected
  const filteredTags =
    allTags?.filter((tag) => {
      const isNotSelected = !selectedTags.some((t) => t.id === tag.id);
      const matchesInput = tag.name
        .toLowerCase()
        .includes(inputValue.toLowerCase());
      return isNotSelected && matchesInput;
    }) || [];

  // Check if input matches existing tag exactly (case-insensitive)
  const exactMatch = allTags?.find(
    (tag) => tag.name.toLowerCase() === inputValue.toLowerCase().trim()
  );

  // Reset highlighted index when filtered tags change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredTags.length, inputValue]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle input change
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsDropdownOpen(value.length > 0);
  };

  // Handle tag selection from dropdown
  const handleSelectTag = (tag: SimpleTag) => {
    onTagAdd(tag);
    setInputValue("");
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  // Handle creating new tag (Enter key)
  const handleCreateTag = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) return;

    // If exact match exists, add it instead of creating new
    if (exactMatch) {
      handleSelectTag(exactMatch);
      return;
    }

    // Create new tag (temporary ID, will be replaced by server)
    const newTag: SimpleTag = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: trimmedValue.toLowerCase(), // Preview normalized name
    };

    onTagAdd(newTag);
    setInputValue("");
    setIsDropdownOpen(false);
    inputRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleCreateTag();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredTags.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;

      case "Enter":
        e.preventDefault();
        if (filteredTags[highlightedIndex]) {
          handleSelectTag(filteredTags[highlightedIndex]);
        } else {
          handleCreateTag();
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsDropdownOpen(false);
        setInputValue("");
        break;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 text-sm"
            >
              <TagIcon className="w-3 h-3 mr-1" />
              {tag.name}
              <button
                type="button"
                onClick={() => onTagRemove(tag.id)}
                disabled={disabled}
                className="ml-1 hover:bg-muted rounded-sm p-0.5 transition-colors"
                aria-label={`Remove ${tag.name} tag`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setIsDropdownOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
          aria-label="Tag input"
          aria-autocomplete="list"
          aria-controls="tag-dropdown"
          aria-expanded={isDropdownOpen}
        />

        {/* Dropdown */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            id="tag-dropdown"
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading tags...
              </div>
            ) : filteredTags.length > 0 ? (
              <>
                {filteredTags.map((tag, index) => (
                  <button
                    key={tag.id}
                    type="button"
                    role="option"
                    aria-selected={
                      index === highlightedIndex ? "true" : "false"
                    }
                    aria-label={`Select tag ${tag.name}`}
                    onClick={() => handleSelectTag(tag)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer transition-colors",
                      index === highlightedIndex && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-3 h-3 text-muted-foreground" />
                      <span>{tag.name}</span>
                    </div>
                  </button>
                ))}

                {/* Create new tag option */}
                {inputValue.trim() && !exactMatch && (
                  <button
                    type="button"
                    role="option"
                    aria-selected="false"
                    aria-label={`Create new tag ${inputValue.toLowerCase()}`}
                    onClick={handleCreateTag}
                    className="w-full px-3 py-2 text-left text-sm border-t hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <TagIcon className="w-3 h-3 text-primary" />
                      <span className="text-primary font-medium">
                        Create &quot;{inputValue.toLowerCase()}&quot;
                      </span>
                    </div>
                  </button>
                )}
              </>
            ) : inputValue.trim() ? (
              <button
                type="button"
                role="option"
                aria-selected="false"
                aria-label={`Create new tag ${inputValue.toLowerCase()}`}
                onClick={handleCreateTag}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TagIcon className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">
                    Create &quot;{inputValue.toLowerCase()}&quot;
                  </span>
                </div>
              </button>
            ) : (
              <div className="px-3 py-6 text-sm text-center text-muted-foreground">
                No tags found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      {!disabled && (
        <p className="text-xs text-muted-foreground">
          Type to search or create new tags. Press Enter to add.
        </p>
      )}
    </div>
  );
}
