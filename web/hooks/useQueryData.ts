/**
 * Enhanced useQuery Hook - React Query Wrapper
 * 
 * A wrapper around @tanstack/react-query's useQuery that provides:
 * - Automatic API URL handling
 * - TypeScript generics for response types
 * - Consistent error handling
 * - Loading states
 * - Refresh/refetch functionality
 * - Caching and automatic background updates
 * 
 * Usage:
 * ```tsx
 * const { data, loading, error, refetch } = useQueryData<StudentResponse>(
 *   'students',  // Query key
 *   '/api/students'  // API endpoint
 * );
 * ```
 */

import { useQuery as useReactQuery, useMutation as useReactMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

interface UseQueryOptions<T> {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

interface UseMutationOptions<TData, _TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: string) => void;
  onSettled?: () => void;
}

/**
 * Fetch data with React Query caching
 */
export function useQueryData<T = any>(
  queryKey: string | string[],
  url: string | null,
  options: UseQueryOptions<T> = {}
) {
  const {
    enabled = true,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    onSuccess,
    onError,
  } = options;

  const query = useReactQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: async () => {
      if (!url) throw new Error("No URL provided");
      
      const response = await apiFetch(url);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle different response formats
      if (data.data) return data.data;
      if (data.success !== undefined) return data;
      return data;
    },
    enabled: enabled && !!url,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
  });

  // Call callbacks
  if (query.isSuccess && onSuccess && query.data) {
    onSuccess(query.data as T);
  }
  
  if (query.isError && onError && query.error) {
    onError(query.error.message);
  }

  return {
    data: query.data as T | undefined,
    loading: query.isLoading || query.isFetching,
    error: query.error?.message,
    refetch: query.refetch,
    isSuccess: query.isSuccess,
    isError: query.isError,
    isFetching: query.isFetching,
    isStale: query.isStale,
  };
}

/**
 * Mutation with React Query
 */
export function useQueryMutation<TData = any, TVariables = any>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: UseMutationOptions<TData, TVariables> = {}
) {
  const { onSuccess, onError, onSettled } = options;

  const mutation = useReactMutation({
    mutationFn: async (variables: TVariables) => {
      const response = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variables),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (data.data) return data.data;
      if (data.success !== undefined) return data;
      return data;
    },
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data as TData);
    },
    onError: (error: Error) => {
      if (onError) onError(error.message);
    },
    onSettled,
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    loading: mutation.isPending,
    error: mutation.error?.message,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    data: mutation.data as TData | undefined,
    reset: mutation.reset,
  };
}

/**
 * Helper: Invalidate query cache
 * Use this to refresh data after mutations
 */
export { useQueryClient } from "@tanstack/react-query";
