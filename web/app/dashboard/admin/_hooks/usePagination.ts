'use client';

import { useState, useCallback } from 'react';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPerPage?: number;
}

export function usePagination(total: number, options?: UsePaginationOptions) {
  const [page, setPage] = useState(options?.initialPage || 1);
  const [perPage, setPerPage] = useState(options?.initialPerPage || 25);

  const totalPages = Math.ceil(total / perPage);

  const goToPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  const changePerPage = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1); // Reset to first page when changing per page
  }, []);

  const getStart = () => (page - 1) * perPage;
  const getEnd = () => Math.min(page * perPage, total);

  return {
    page,
    perPage,
    total,
    totalPages,
    setPage: goToPage,
    setPerPage: changePerPage,
    nextPage,
    prevPage,
    getStart,
    getEnd,
  };
}
