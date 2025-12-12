/**
 * useFetch Hook - Simplified data fetching with loading states
 * 
 * Eliminates duplicate data fetching code across components
 * Provides consistent loading, error, and success states
 */

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';

interface UseFetchOptions {
  immediate?: boolean; // Fetch immediately on mount
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: (data: T | null) => void;
}

/**
 * Custom hook for data fetching with built-in loading and error states
 * 
 * @example
 * const { data, loading, error, refetch } = useFetch<User[]>('/api/admin/users');
 */
export function useFetch<T = any>(
  url: string | null,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { immediate = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate && !!url);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Don't fetch if URL is empty
    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('Fetching data', { url });
      
      const response = await apiFetch(url);
      const result = await response.json();

      if (result.success || result.data) {
        const fetchedData = result.data || result;
        setData(fetchedData);
        onSuccess?.(fetchedData);
        logger.info('Data fetched successfully', { url });
      } else {
        throw new Error(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      onError?.(errorMsg);
      
      // Don't log rate limit errors - they're expected and handled gracefully
      if (!errorMsg.includes('Rate limit exceeded')) {
        logger.error('Fetch error', err, { url });
      }
    } finally {
      setLoading(false);
    }
  }, [url, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData,
  };
}

/**
 * Hook for POST/PUT/DELETE requests with loading states
 * 
 * @example
 * const { mutate, loading } = useMutation('/api/admin/users', 'POST');
 * await mutate({ email: 'user@example.com', name: 'John' });
 */
export function useMutation<TData = any, TResult = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (data?: TData): Promise<TResult | null> => {
      setLoading(true);
      setError(null);

      try {
        logger.debug('Mutating data', { url, method });
        
        const response = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: data ? JSON.stringify(data) : undefined,
        });

        const result = await response.json();

        if (result.success || result.data) {
          logger.info('Mutation successful', { url, method });
          return result.data || result;
        } else {
          throw new Error(result.error || 'Mutation failed');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMsg);
        logger.error('Mutation error', { url, method, error: errorMsg });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, method]
  );

  return { mutate, loading, error };
}
