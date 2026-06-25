import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, description, id, ...props }, ref) => {
    const defaultId = React.useId();
    const inputId = id || defaultId;
    const labelId = label ? `${inputId}-label` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const descriptionId = description ? `${inputId}-desc` : undefined;

    const inputElement = (
      <input
        type={type}
        id={inputId}
        ref={ref}
        aria-labelledby={labelId}
        aria-invalid={!!error}
        aria-errormessage={errorId}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'flex h-11 w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-500 dark:placeholder:text-stone-400 transition-all duration-200 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:border-primary/50',
          error && 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/10',
          className
        )}
        {...props}
      />
    );

    if (label || error || description) {
      return (
        <div className="space-y-1.5 w-full text-left font-sans">
          {label && (
            <label
              id={labelId}
              htmlFor={inputId}
              className="block text-sm font-medium text-stone-700 dark:text-stone-300"
            >
              {label}
              {props.required && (
                <span className="text-red-500 ml-1" aria-hidden="true">
                  *
                </span>
              )}
            </label>
          )}
          {inputElement}
          {description && (
            <p id={descriptionId} className="text-xs text-stone-500 dark:text-stone-400">
              {description}
            </p>
          )}
          {error && (
            <p id={errorId} role="alert" className="text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      );
    }

    return inputElement;
  }
);
Input.displayName = 'Input';

export { Input };
