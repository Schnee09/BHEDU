/**
 * React Query Provider
 * 
 * Configures React Query with:
 * - Default options for queries and mutations
 * - Stale time and cache time settings
 * - Retry logic
 * - Devtools (development only)
 */

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            
            // Cache time: Unused data stays in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            
            // Retry failed requests 2 times
            retry: 2,
            
            // Retry delay increases exponentially
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            
            // Refetch on window focus (useful for keeping data fresh)
            refetchOnWindowFocus: true,
            
            // Refetch on reconnect
            refetchOnReconnect: true,
            
            // Refetch on mount if data is stale
            refetchOnMount: true,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
            
            // Retry delay for mutations
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
