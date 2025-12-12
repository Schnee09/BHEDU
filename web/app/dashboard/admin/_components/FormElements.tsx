'use client';

import React from 'react';

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helperText?: string;
}

export function FormField({
  label,
  error,
  required = false,
  children,
  helperText,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors ${
        error
          ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      } ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error, className = '', ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors resize-none ${
        error
          ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      } ${className}`}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string | number; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, options, className = '', ...props }, ref) => (
    <select
      ref={ref}
      className={`w-full px-3 py-2 border rounded-lg font-medium text-sm transition-colors ${
        error
          ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-transparent'
          : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
      } ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
);
Select.displayName = 'Select';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', ...props }, ref) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        className={`w-4 h-4 border border-gray-300 rounded accent-blue-600 ${className}`}
        {...props}
      />
      {label && <span className="text-sm text-gray-900">{label}</span>}
    </label>
  )
);
Checkbox.displayName = 'Checkbox';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
