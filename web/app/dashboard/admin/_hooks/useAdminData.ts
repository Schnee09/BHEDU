'use client';

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';

export interface UseAdminDataOptions {
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export function useAdminData<T = any>(
  url: string | null,
  options?: UseAdminDataOptions
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const processedData = Array.isArray(result) ? result : result.data || result;

      setData(processedData);
      options?.onSuccess?.(processedData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMsg);
      logger.error('Admin data fetch failed', new Error(errorMsg), { url });
      options?.onError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate: setData,
  };
}
