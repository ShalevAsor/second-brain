// lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

/**
 * Default configuration for React Query
 * Centralized to ensure consistency across the app
 */
export const defaultQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
};

/**
 * Create a new QueryClient instance
 * Use this function instead of creating QueryClient directly
 * to ensure proper SSR handling
 */
export function makeQueryClient() {
  return new QueryClient(defaultQueryClientOptions);
}
