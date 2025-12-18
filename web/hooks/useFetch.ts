/**
 * useFetch Hook - Simplified data fetching with loading states
 * 
 * Eliminates duplicate data fetching code across components
 * Provides consistent loading, error, and success states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api/client';
import { logger } from '@/lib/logger';

type AnyRecord = Record<string, any>;

interface UseFetchOptions {
  immediate?: boolean; // Fetch immediately on mount
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  cancelPrevious?: boolean; // Cancel previous in-flight request when url/refetch changes (default true)
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
  const { immediate = true, onSuccess, onError, cancelPrevious = true } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate && !!url);
  const [error, setError] = useState<string | null>(null);

  // Prevent state updates after unmount.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetLoading = useCallback((value: boolean) => {
    if (mountedRef.current) setLoading(value);
  }, []);

  const safeSetError = useCallback((value: string | null) => {
    if (mountedRef.current) setError(value);
  }, []);

  const safeSetData = useCallback((value: T | null) => {
    if (mountedRef.current) setData(value);
  }, []);

  // Abort + stale response protection.
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const parseJsonSafely = async (response: Response) => {
    // 204/205 and empty bodies are valid for some endpoints.
    if (response.status === 204 || response.status === 205) return null;

    // In unit tests we sometimes mock Response objects without full Headers.
    const headersAny = (response as any).headers;
    const contentType =
      typeof headersAny?.get === 'function' ? headersAny.get('content-type') || '' : '';
    if (!contentType.toLowerCase().includes('application/json')) {
      const text = await response.text().catch(() => '');
      return { __nonJson: true, text };
    }

    try {
      return await response.json();
    } catch (_e) {
      const text = await response.text().catch(() => '');
      return { __invalidJson: true, text };
    }
  };

  const fetchData = useCallback(async () => {
    // Don't fetch if URL is empty
    if (!url) {
      safeSetLoading(false);
      return;
    }

    safeSetLoading(true);
    safeSetError(null);

    // Create a request ID so older responses can't overwrite newer state.
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    // Cancel previous request if enabled.
    if (cancelPrevious) {
      abortRef.current?.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      logger.debug('Fetching data', { url });
      
      const response = await apiFetch(url, { signal: controller.signal });
  const result = await parseJsonSafely(response);

      // Ignore stale responses.
      if (requestId !== requestIdRef.current) return;

      const isPlainObject = (value: any): value is AnyRecord =>
        !!value && typeof value === 'object' && !Array.isArray(value);

      // Plural keys commonly returned by API routes in this repo and in the DB schema.
      // IMPORTANT: When the server returns an envelope (e.g. { students, total }), we
      // preserve the envelope to avoid breaking pages that rely on those extra fields.
      const knownCollectionKeys = [
        // Common in the existing frontend
        'data',
        'students',
        'classes',
        'courses',
        'lessons',
        'assignments',
        'assignment_categories',
        'categories',
        'grades',
        'attendance',
        'attendance_reports',
        'academic_years',
        'subjects',
        'guardians',
        // Finance
        'fee_types',
        'feeTypes',
        'fee_assignments',
        'invoices',
        'invoice_items',
        'payments',
        'payment_methods',
        'payment_schedules',
        'payment_schedule_installments',
        'payment_allocations',
        // Other schema bits
        'profiles',
        'notifications',
        'school_settings',
        'import_logs',
        'import_errors',
        'audit_logs',
        'qr_codes',
        'grading_scales',
        'enrollments',
        'student_accounts',
      ] as const;

      const hasAnyCollectionKey = (payload: AnyRecord) =>
        knownCollectionKeys.some((k) => Object.prototype.hasOwnProperty.call(payload, k));

      // Accept several valid response shapes:
      // - raw arrays (e.g. `[{...}, {...}]`)
      // - { success: true, data: [...] }
      // - { success: true, students: [...] } etc.
      // If the server explicitly returns success: false, treat it as an error.
      if (result && typeof result === 'object' && (result as any).success === false) {
        throw new Error((result as any).error || 'Failed to fetch data');
      }

      // If we didn't get JSON but the server responded with an error, surface something helpful.
      if ((result as any)?.__nonJson || (result as any)?.__invalidJson) {
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        // Allow consumers that truly want text to still get it.
        safeSetData(result as any);
        onSuccess?.(result);
        logger.info('Data fetched successfully (non-JSON)', { url });
        return;
      }

      // Honor HTTP status for non-success cases even if a body exists.
      if (!response.ok) {
        throw new Error((result as any)?.error || `Request failed (${response.status})`);
      }

      let fetchedData: any;

      if (Array.isArray(result)) {
        // If the server returned a raw array, wrap it in a small envelope so
        // consumers expecting { students: [...], total } or { data: [...] } don't break.
        const arr = result;
        const envelope: any = { data: arr, total: arr.length };

        // Try to infer the resource name from the URL path (e.g. '/api/admin/students')
        try {
          const pathname = new URL(url!, 'http://localhost').pathname; // base required for URL
          const parts = pathname.split('/').filter(Boolean);
          const last = parts[parts.length - 1];
          // If last segment looks plural (ends with 's'), attach it
          if (last && last.endsWith('s')) {
            envelope[last] = arr;
          }
        } catch (_e) {
          // ignore URL parsing errors - envelope will still contain `data` and `total`
        }

        fetchedData = envelope;
      } else if (isPlainObject(result)) {
        // Preserve envelopes like { students, total, statistics }.
        // Only unwrap when the payload is just an API wrapper around a single key.
        if (hasAnyCollectionKey(result)) {
          fetchedData = result;
        } else if (Object.prototype.hasOwnProperty.call(result, 'data')) {
          fetchedData = (result as any).data;
        } else {
          // Fallback: return the object as-is.
          fetchedData = result;
        }
      } else {
        fetchedData = result;
      }

      // Treat undefined as an error (this avoids downstream code reading .length of undefined)
      if (fetchedData === undefined) {
        throw new Error((result as any)?.error || 'Failed to fetch data');
      }

      // Ignore stale responses.
      if (requestId !== requestIdRef.current) return;

      safeSetData(fetchedData);
      onSuccess?.(fetchedData);
      logger.info('Data fetched successfully', { url });
    } catch (err) {
      // Abort/cancel should not surface as a user-facing error.
      if (err instanceof DOMException && err.name === 'AbortError') {
        logger.debug('Fetch aborted', { url });
        return;
      }

  // Ignore stale responses (including abort errors from a newer request).
  if (requestId !== requestIdRef.current) return;

  const errorMsg = err instanceof Error ? err.message : String(err);
      safeSetError(errorMsg);
      onError?.(errorMsg);
      
      // Don't log rate limit errors - they're expected and handled gracefully
      if (!errorMsg.includes('Rate limit exceeded')) {
        logger.error('Fetch error', err, { url });
      }
    } finally {
      // Only clear loading for the latest request.
      if (requestId === requestIdRef.current) {
        safeSetLoading(false);
      }
    }
  }, [url, onSuccess, onError, cancelPrevious, safeSetData, safeSetError, safeSetLoading]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  // On unmount: abort in-flight request.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    setData: safeSetData,
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

  const parseJsonSafely = async (response: Response) => {
    if (response.status === 204 || response.status === 205) return null;

    const headersAny = (response as any).headers;
    const contentType =
      typeof headersAny?.get === 'function' ? headersAny.get('content-type') || '' : '';
    if (!contentType.toLowerCase().includes('application/json')) {
      const text = await response.text().catch(() => '');
      return { __nonJson: true, text };
    }

    try {
      return await response.json();
    } catch (_e) {
      const text = await response.text().catch(() => '');
      return { __invalidJson: true, text };
    }
  };

  const isPlainObject = (value: any): value is AnyRecord =>
    !!value && typeof value === 'object' && !Array.isArray(value);

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

        const result = await parseJsonSafely(response);

        if ((result as any)?.__nonJson || (result as any)?.__invalidJson) {
          if (!response.ok) {
            throw new Error(`Request failed (${response.status})`);
          }
          logger.info('Mutation successful (non-JSON)', { url, method });
          return result as TResult;
        }

        // If API returns explicit failure, honor it.
        if (result && typeof result === 'object' && (result as any).success === false) {
          throw new Error((result as any).error || 'Mutation failed');
        }

        // Prefer HTTP status if available; fall back to common JSON shapes.
        const okByStatus = response.ok;
        const okByShape = (result as any)?.success === true || (result as any)?.data !== undefined;
        if (!okByStatus && !okByShape) {
          throw new Error((result as any)?.error || 'Mutation failed');
        }

        // Preserve envelopes when they contain more than just `data`.
        if (isPlainObject(result)) {
          const keys = Object.keys(result);
          const hasMeta = keys.some((k) => ['total', 'statistics', 'meta', 'message'].includes(k));

          if (hasMeta) {
            logger.info('Mutation successful', { url, method });
            return result as TResult;
          }

          // Common singular keys
          for (const key of ['data', 'student', 'class', 'grade', 'course', 'invoice', 'payment'] as const) {
            if (Object.prototype.hasOwnProperty.call(result, key)) {
              logger.info('Mutation successful', { url, method });
              return (result as any)[key] as TResult;
            }
          }
        }

        logger.info('Mutation successful', { url, method });
        return result as TResult;
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
