'use client';

import { useState, useCallback } from 'react';

export interface UseFiltersOptions<T> {
  initialFilters?: Partial<T>;
}

export function useFilters<T extends Record<string, any>>(
  data: T[],
  filterFn: (item: T, filters: Partial<T>) => boolean,
  options?: UseFiltersOptions<T>
) {
  const [filters, setFilters] = useState<Partial<T>>(options?.initialFilters || {});

  const setFilter = useCallback((key: keyof T, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  }, []);

  const setMultipleFilters = useCallback((newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(options?.initialFilters || {});
  }, [options?.initialFilters]);

  const filteredData = data.filter(item => filterFn(item, filters));

  return {
    filters,
    setFilter,
    setMultipleFilters,
    resetFilters,
    filteredData,
  };
}

export function useSearch<T extends Record<string, any>>(
  data: T[],
  searchFn: (item: T, query: string) => boolean
) {
  const [searchQuery, setSearchQuery] = useState('');

  const searchedData = data.filter(item =>
    searchQuery === '' ? true : searchFn(item, searchQuery)
  );

  return {
    searchQuery,
    setSearchQuery,
    searchedData,
  };
}
