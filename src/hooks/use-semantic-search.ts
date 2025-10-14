/**
 * Semantic Search React Query Hooks
 *
 * Client-side hooks for AI-powered semantic search.
 * Handles loading states, caching, debouncing, and error handling.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebouncedValue } from "./use-debounce";
import { semanticSearchNotes, getEmbeddingStatus } from "@/actions/aiActions";
import type { SemanticSearchInput } from "@/schemas/searchSchemas";
import type { SemanticSearchResponse } from "@/services/ai/core/types";
import {
  semanticSearchKeys,
  SEMANTIC_SEARCH_QUERY_KEY,
} from "@/lib/query-keys"; // 🆕 Import from centralized file

/**
 * Hook: Perform semantic search with debouncing
 *
 * Main hook for searching notes with AI.
 * Automatically debounces queries to avoid excessive API calls.
 *
 * @param input - Search input with query and optional filters
 * @param options - Query options (enabled, debounce delay)
 * @returns Query result with search results and stats
 *
 * @example
 * function SearchResults() {
 *   const [query, setQuery] = useState("");
 *
 *   const { data, isLoading, error } = useSemanticSearch({
 *     query,
 *     minSimilarity: 0.7,
 *     maxResults: 10
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <div>
 *       <p>Found {data?.results.length} results</p>
 *       <p>Regenerated {data?.stats.regeneratedCount} embeddings</p>
 *       {data?.results.map(result => (
 *         <NoteCard key={result.note.id} note={result.note} similarity={result.similarity} />
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useSemanticSearch(
  input: SemanticSearchInput,
  options?: {
    enabled?: boolean;
    debounceDelay?: number;
    onSuccess?: (data: SemanticSearchResponse) => void;
    onError?: (error: string) => void;
  }
) {
  const {
    enabled = true,
    debounceDelay = 1000,
    onSuccess,
    onError,
  } = options || {};

  // Debounce query to avoid excessive API calls
  const debouncedQuery = useDebouncedValue(input.query, debounceDelay);

  // Build debounced input
  const debouncedInput: SemanticSearchInput = {
    ...input,
    query: debouncedQuery,
  };

  // Only enable query if:
  // 1. enabled option is true
  // 2. query is at least 3 characters (after debounce)
  const shouldFetch = enabled && debouncedQuery.length >= 3;

  return useQuery({
    queryKey: semanticSearchKeys.search(debouncedQuery, {
      // 🆕 Using centralized key
      minSimilarity: input.minSimilarity,
      maxResults: input.maxResults,
      folderId: input.folderId,
      tagIds: input.tagIds,
    }),
    queryFn: async () => {
      const result = await semanticSearchNotes(debouncedInput);

      if (!result.success) {
        throw new Error(result.error || "Search failed");
      }

      return result.data;
    },
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1, // Only retry once on failure
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
}

/**
 * Hook: Get embedding status (health check)
 *
 * Useful for showing user how many notes need processing.
 * Can be displayed before search as "Analyzing X notes..."
 *
 * @returns Query result with embedding statistics
 *
 * @example
 * function EmbeddingStatus() {
 *   const { data, isLoading } = useEmbeddingStatus();
 *
 *   if (isLoading) return <Spinner />;
 *
 *   return (
 *     <div>
 *       <p>Total notes: {data?.total}</p>
 *       <p>Ready to search: {data?.fresh}</p>
 *       <p>Need processing: {data?.needsRegeneration}</p>
 *     </div>
 *   );
 * }
 */
export function useEmbeddingStatus(options?: { enabled?: boolean }) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: semanticSearchKeys.status(), // 🆕 Using centralized key
    queryFn: async () => {
      const result = await getEmbeddingStatus();

      if (!result.success) {
        throw new Error(result.error || "Failed to get embedding status");
      }

      return result.data;
    },
    enabled,
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook: Clear semantic search cache
 *
 * Useful for forcing a fresh search after note updates.
 * Called automatically when notes are edited/deleted.
 *
 * @example
 * function RefreshButton() {
 *   const clearCache = useClearSemanticSearchCache();
 *
 *   return (
 *     <Button onClick={clearCache}>
 *       Refresh Search Results
 *     </Button>
 *   );
 * }
 */
export function useClearSemanticSearchCache() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({
      queryKey: SEMANTIC_SEARCH_QUERY_KEY, // 🆕 Using centralized constant
    });
  };
}

/**
 * Hook: Prefetch search results
 *
 * Useful for optimistic loading when user is typing.
 * Starts fetching before user finishes typing.
 *
 * @param input - Search input to prefetch
 *
 * @example
 * function SearchInput() {
 *   const [query, setQuery] = useState("");
 *   const prefetch = usePrefetchSearch();
 *
 *   useEffect(() => {
 *     if (query.length >= 3) {
 *       // Start prefetching as user types
 *       prefetch({ query });
 *     }
 *   }, [query]);
 *
 *   return <Input value={query} onChange={e => setQuery(e.target.value)} />;
 * }
 */
export function usePrefetchSearch() {
  const queryClient = useQueryClient();

  return (input: SemanticSearchInput) => {
    if (input.query.length < 3) return;

    queryClient.prefetchQuery({
      queryKey: semanticSearchKeys.search(input.query, {
        // 🆕 Using centralized key
        minSimilarity: input.minSimilarity,
        maxResults: input.maxResults,
        folderId: input.folderId,
        tagIds: input.tagIds,
      }),
      queryFn: async () => {
        const result = await semanticSearchNotes(input);
        if (!result.success) {
          throw new Error(result.error || "Search failed");
        }
        return result.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}
