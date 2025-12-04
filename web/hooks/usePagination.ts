/**
 * usePagination Hook - Pagination state management
 * 
 * Eliminates duplicate pagination code
 * Provides page navigation, limit controls, and total page calculation
 */

import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  totalItems?: number;
}

interface UsePaginationResult {
  page: number;
  limit: number;
  offset: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotalItems: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  reset: () => void;
}

/**
 * Custom hook for pagination state
 * 
 * @example
 * const pagination = usePagination({ initialPage: 1, initialLimit: 20 });
 * 
 * // Use in API call
 * const { data } = useFetch(`/api/users?page=${pagination.page}&limit=${pagination.limit}`);
 * pagination.setTotalItems(data.total);
 * 
 * // Navigation
 * <button onClick={pagination.prevPage} disabled={!pagination.hasPrevPage}>Previous</button>
 * <button onClick={pagination.nextPage} disabled={!pagination.hasNextPage}>Next</button>
 */
export function usePagination({
  initialPage = 1,
  initialLimit = 20,
  totalItems = 0,
}: UsePaginationOptions = {}): UsePaginationResult {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotalItems] = useState(totalItems);

  // Calculate derived values
  const offset = useMemo(() => (page - 1) * limit, [page, limit]);
  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit]);
  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPrevPage = useMemo(() => page > 1, [page]);

  const handleSetPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    // Reset to first page when limit changes
    setPage(1);
  }, []);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage((prev) => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPage((prev) => prev - 1);
    }
  }, [hasPrevPage]);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const goToLastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
    setTotalItems(0);
  }, [initialPage, initialLimit]);

  return {
    page,
    limit,
    offset,
    totalPages,
    hasNextPage,
    hasPrevPage,
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    setTotalItems,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    reset,
  };
}
