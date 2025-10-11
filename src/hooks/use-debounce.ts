import { useEffect, useRef, useCallback, useState } from "react";

/**
 * useDebounce Hook
 *
 * Delays function execution until after a specified time has passed
 * since the last time it was invoked.
 *
 * Perfect for:
 * - Auto-save after user stops typing
 * - Search input (wait for user to finish typing)
 * - Any input that triggers expensive operations
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 *
 * @example
 * ```typescript
 * const debouncedSave = useDebounce((content: string) => {
 *   saveNote(content);
 * }, 2000); // Wait 2 seconds after last change
 *
 * // User types: "H" -> "He" -> "Hello"
 * // Only calls saveNote("Hello") after 2s of inactivity
 * debouncedSave(content);
 * ```
 */
export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): T {
  // Store timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Store latest callback in ref to avoid stale closures
  const callbackRef = useRef<T>(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced function
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  return debouncedCallback;
}

/**
 * useDebouncedValue Hook
 *
 * Returns a debounced version of a value.
 * The value will only update after the specified delay has passed
 * since the last change.
 *
 * Perfect for:
 * - Debouncing search queries
 * - Debouncing filter values
 * - Any value that triggers expensive re-renders
 *
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
 *
 * // Only triggers search after 500ms of no typing
 * useEffect(() => {
 *   searchNotes(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
}
