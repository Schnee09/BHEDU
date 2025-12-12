/**
 * Accessible Input Component
 * 
 * Features:
 * - Built-in label association
 * - Error message support with aria-invalid
 * - Description text with aria-describedby
 * - Required field indication
 * - Proper ARIA attributes
 */

import React, { InputHTMLAttributes } from 'react';

interface AccessibleInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
  helpText?: string;
}

export const AccessibleInput = React.forwardRef<
  HTMLInputElement,
  AccessibleInputProps
>(
  (
    {
      label,
      error,
      description,
      required,
      helpText,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const descriptionId = description || helpText ? `${inputId}-description` : undefined;
    const labelId = label ? `${inputId}-label` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            id={labelId}
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            {label}
            {required && (
              <>
                {' '}
                <span className="text-red-600" aria-label="required">
                  *
                </span>
              </>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          {...props}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-errormessage={errorId}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-labelledby={labelId}
          className={`
            w-full px-4 py-2 rounded-lg
            border border-stone-300 dark:border-stone-600
            bg-white dark:bg-stone-900
            text-stone-900 dark:text-stone-100
            placeholder-stone-500 dark:placeholder-stone-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-stone-100 dark:disabled:bg-stone-800
            disabled:text-stone-500 dark:disabled:text-stone-400
            disabled:cursor-not-allowed
            transition-colors
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />

        {description && (
          <p
            id={descriptionId}
            className="text-sm text-stone-600 dark:text-stone-400"
          >
            {description}
          </p>
        )}

        {helpText && !error && (
          <p
            id={descriptionId}
            className="text-sm text-stone-600 dark:text-stone-400"
          >
            {helpText}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

/**
 * Accessible Select Component
 */
interface AccessibleSelectProps
  extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'type'> {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  emptyOption?: string;
}

export const AccessibleSelect = React.forwardRef<
  HTMLSelectElement,
  AccessibleSelectProps
>(
  (
    {
      label,
      error,
      description,
      required,
      options,
      emptyOption,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${selectId}-error` : undefined;
    const descriptionId = description ? `${selectId}-description` : undefined;
    const labelId = label ? `${selectId}-label` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            id={labelId}
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            {label}
            {required && (
              <>
                {' '}
                <span className="text-red-600" aria-label="required">
                  *
                </span>
              </>
            )}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          {...props}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-errormessage={errorId}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-labelledby={labelId}
          className={`
            w-full px-4 py-2 rounded-lg
            border border-stone-300 dark:border-stone-600
            bg-white dark:bg-stone-900
            text-stone-900 dark:text-stone-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-stone-100 dark:disabled:bg-stone-800
            disabled:text-stone-500 dark:disabled:text-stone-400
            disabled:cursor-not-allowed
            transition-colors
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        >
          {emptyOption && <option value="">{emptyOption}</option>}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {description && (
          <p
            id={descriptionId}
            className="text-sm text-stone-600 dark:text-stone-400"
          >
            {description}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

/**
 * Accessible Textarea Component
 */
interface AccessibleTextareaProps
  extends InputHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  description?: string;
  required?: boolean;
  rows?: number;
}

export const AccessibleTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AccessibleTextareaProps
>(
  (
    {
      label,
      error,
      description,
      required,
      rows = 4,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${textareaId}-error` : undefined;
    const descriptionId = description ? `${textareaId}-description` : undefined;
    const labelId = label ? `${textareaId}-label` : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={textareaId}
            id={labelId}
            className="block text-sm font-medium text-stone-700 dark:text-stone-300"
          >
            {label}
            {required && (
              <>
                {' '}
                <span className="text-red-600" aria-label="required">
                  *
                </span>
              </>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          {...props}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-errormessage={errorId}
          aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
          aria-labelledby={labelId}
          className={`
            w-full px-4 py-2 rounded-lg
            border border-stone-300 dark:border-stone-600
            bg-white dark:bg-stone-900
            text-stone-900 dark:text-stone-100
            placeholder-stone-500 dark:placeholder-stone-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-stone-100 dark:disabled:bg-stone-800
            disabled:text-stone-500 dark:disabled:text-stone-400
            disabled:cursor-not-allowed
            transition-colors resize-vertical
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
        />

        {description && (
          <p
            id={descriptionId}
            className="text-sm text-stone-600 dark:text-stone-400"
          >
            {description}
          </p>
        )}

        {error && (
          <p
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';
