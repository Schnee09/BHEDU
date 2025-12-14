'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

export interface UseAdminFormOptions<T> {
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

export function useAdminForm<T extends Record<string, any>>(
  initialValues: T,
  options?: UseAdminFormOptions<T>
) {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);

  const setField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setMultipleFields = useCallback((fields: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  }, []);

  const reset = useCallback(() => {
    setFormData(initialValues);
    setErrors({});
  }, [initialValues]);

  const handleSubmit = useCallback(async (
    onSubmit: (data: T) => Promise<any>
  ) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        setLoading(true);
        setErrors({});

        const result = await onSubmit(formData);
        options?.onSuccess?.(result);

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to submit form';
        logger.error('Admin form submission failed', err instanceof Error ? err : new Error(errorMsg));
        options?.onError?.(err instanceof Error ? err : new Error(errorMsg));
        throw err;
      } finally {
        setLoading(false);
      }
    };
  }, [formData, options]);

  return {
    formData,
    errors,
    loading,
    setField,
    setMultipleFields,
    reset,
    handleSubmit,
  };
}
