/**
 * useForm Hook - Form state management with validation
 * 
 * Eliminates duplicate form handling code
 * Provides validation, dirty tracking, and reset functionality
 */

import { useState, useCallback, ChangeEvent } from 'react';
import { logger } from '@/lib/logger';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void> | void;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isDirty: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  reset: () => void;
  resetForm: (newValues?: T) => void;
}

/**
 * Custom hook for form state management
 * 
 * @example
 * const form = useForm({
 *   initialValues: { email: '', password: '' },
 *   onSubmit: async (values) => {
 *     await loginUser(values);
 *   },
 *   validate: (values) => {
 *     const errors = {};
 *     if (!values.email) errors.email = 'Required';
 *     return errors;
 *   }
 * });
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
}: UseFormOptions<T>): UseFormResult<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : value;

    setValues((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
    
    setIsDirty(true);

    // Clear error when user starts typing
    if (errors[name as keyof T]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  }, [errors]);

  const handleBlur = useCallback((field: keyof T) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    // Validate field on blur
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: validationErrors[field],
        }));
      }
    }
  }, [validate, values]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate all fields
      let validationErrors: Partial<Record<keyof T, string>> = {};
      if (validate) {
        validationErrors = validate(values);
        setErrors(validationErrors);
      }

      // Don't submit if there are errors
      if (Object.keys(validationErrors).length > 0) {
        logger.warn('Form validation failed', { errors: validationErrors });
        return;
      }

      setIsSubmitting(true);

      try {
        logger.debug('Submitting form', { values });
        await onSubmit(values);
        logger.info('Form submitted successfully');
        setIsDirty(false);
      } catch (error) {
        logger.error('Form submission error', { error });
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  const resetForm = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    reset,
    resetForm,
  };
}
