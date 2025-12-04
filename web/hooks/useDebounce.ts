/**
 * useDebounce Hook - Debounce values for search inputs
 * 
 * Prevents excessive API calls during user typing
 * Returns debounced value after specified delay
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearch = useDebounce(searchQuery, 500);
 * 
 * useEffect(() => {
 *   // This will only trigger 500ms after user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook to get both immediate and debounced values
 * Useful when you need to show immediate feedback but debounce API calls
 * 
 * @example
 * const { value, debouncedValue, setValue } = useDebouncedState('', 500);
 * 
 * // Show immediate value in input
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 * 
 * // Use debounced value for API call
 * useEffect(() => {
 *   fetchResults(debouncedValue);
 * }, [debouncedValue]);
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 500
): {
  value: T;
  debouncedValue: T;
  setValue: (value: T) => void;
} {
  const [value, setValue] = useState<T>(initialValue);
  const debouncedValue = useDebounce(value, delay);

  return {
    value,
    debouncedValue,
    setValue,
  };
}
