/**
 * FormField Component - DUAL THEME
 * Reusable form field with validation states
 */

"use client";

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode, useState } from 'react';

// Base props for all form fields
interface BaseFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  success?: boolean;
  touched?: boolean;
}

// Input Field
interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const FormInput = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  error,
  hint,
  required,
  success,
  touched,
  leftIcon,
  rightIcon,
  size = 'md',
  className = '',
  id,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  
  const showError = touched && error;
  const showSuccess = touched && success && !error;
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  const stateClasses = showError
    ? 'border-error focus:border-error focus:ring-error/30 dark:border-error dark:focus:border-error'
    : showSuccess
    ? 'border-success focus:border-success focus:ring-success/30 dark:border-success dark:focus:border-success'
    : 'border-border focus:border-primary focus:ring-primary/20 dark:border-white/10 dark:focus:border-primary';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={fieldId}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          className={`
            w-full rounded-xl font-medium transition-all duration-200
            bg-surface dark:bg-white/5
            ${stateClasses}
            ${sizeClasses[size]}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon || showError || showSuccess ? 'pr-10' : ''}
            placeholder:text-muted/60
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-neumorphic-inset dark:shadow-none
          `}
          aria-invalid={showError ? 'true' : undefined}
          aria-describedby={showError ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        
        {/* Right side icons/indicators */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showError && (
            <svg className="w-5 h-5 text-error animate-scale-in" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {showSuccess && (
            <svg className="w-5 h-5 text-success animate-scale-in" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {rightIcon && !showError && !showSuccess && rightIcon}
        </div>

        {/* Focus ring animation */}
        <div className={`
          absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-200
          ${focused ? 'opacity-100' : 'opacity-0'}
          ring-2 ring-primary/20 dark:ring-primary/30
        `} />
      </div>
      
      {/* Error message with animation */}
      {showError && (
        <p id={`${fieldId}-error`} className="text-sm text-error flex items-center gap-1.5 animate-slide-in-down">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {/* Success message */}
      {showSuccess && !error && (
        <p className="text-sm text-success flex items-center gap-1.5 animate-slide-in-down">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Looks good!
        </p>
      )}
      
      {/* Hint */}
      {hint && !showError && !showSuccess && (
        <p id={`${fieldId}-hint`} className="text-sm text-muted">{hint}</p>
      )}
    </div>
  );
});

FormInput.displayName = 'FormInput';

// Textarea Field
interface TextareaFieldProps extends BaseFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const FormTextarea = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({
  label,
  error,
  hint,
  required,
  success,
  touched,
  className = '',
  id,
  ...props
}, ref) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const showError = touched && error;
  const showSuccess = touched && success && !error;
  
  const stateClasses = showError
    ? 'border-error focus:border-error focus:ring-error/30'
    : showSuccess
    ? 'border-success focus:border-success focus:ring-success/30'
    : 'border-border focus:border-primary focus:ring-primary/20 dark:border-white/10 dark:focus:border-primary';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <textarea
        ref={ref}
        id={fieldId}
        className={`
          w-full px-4 py-3 rounded-xl font-medium transition-all duration-200
          bg-surface dark:bg-white/5
          ${stateClasses}
          placeholder:text-muted/60
          focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-neumorphic-inset dark:shadow-none
          min-h-[120px] resize-y
        `}
        aria-invalid={showError ? 'true' : undefined}
        {...props}
      />
      
      {showError && (
        <p className="text-sm text-error flex items-center gap-1.5 animate-slide-in-down">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {hint && !showError && (
        <p className="text-sm text-muted">{hint}</p>
      )}
    </div>
  );
});

FormTextarea.displayName = 'FormTextarea';

// Select Field
interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, SelectFieldProps>(({
  label,
  error,
  hint,
  required,
  success,
  touched,
  options,
  placeholder,
  className = '',
  id,
  ...props
}, ref) => {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const showError = touched && error;
  const showSuccess = touched && success && !error;
  
  const stateClasses = showError
    ? 'border-error focus:border-error focus:ring-error/30'
    : showSuccess
    ? 'border-success focus:border-success focus:ring-success/30'
    : 'border-border focus:border-primary focus:ring-primary/20 dark:border-white/10 dark:focus:border-primary';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          className={`
            w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 appearance-none
            bg-surface dark:bg-white/5
            ${stateClasses}
            focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-neumorphic-inset dark:shadow-none
            pr-10
          `}
          aria-invalid={showError ? 'true' : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {showError && (
        <p className="text-sm text-error flex items-center gap-1.5 animate-slide-in-down">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {hint && !showError && (
        <p className="text-sm text-muted">{hint}</p>
      )}
    </div>
  );
});

FormSelect.displayName = 'FormSelect';

// Form Group for organizing fields
interface FormGroupProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function FormGroup({ children, title, description, className = '' }: FormGroupProps) {
  return (
    <fieldset className={`space-y-4 ${className}`}>
      {title && (
        <legend className="text-lg font-semibold text-foreground mb-1 font-heading">{title}</legend>
      )}
      {description && (
        <p className="text-sm text-muted mb-4">{description}</p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
}

// Form Row for horizontal layout
interface FormRowProps {
  children: ReactNode;
  className?: string;
}

export function FormRow({ children, className = '' }: FormRowProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
      {children}
    </div>
  );
}

// Form Actions for submit buttons
interface FormActionsProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center' | 'between';
}

export function FormActions({ children, className = '', align = 'right' }: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
    between: 'justify-between',
  };

  return (
    <div className={`flex items-center gap-3 pt-4 border-t border-border dark:border-white/10 mt-6 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}

export default FormInput;
