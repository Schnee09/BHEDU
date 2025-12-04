/**
 * Form Components for BH-EDU
 * 
 * Additional form controls to complement the base Input component
 * - Select (dropdown)
 * - Textarea (multi-line text)
 * - Checkbox
 * - Radio buttons
 * - Toggle switch
 * - File upload
 * - Date picker
 */

import React, { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

// ==================== Select Component ====================

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, fullWidth = false, className = '', ...props }, ref) => {
    const selectClasses = `
      w-full px-4 py-3 border-2 rounded-lg bg-white
      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
      disabled:bg-stone-100 disabled:cursor-not-allowed
      transition-all
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-stone-200'}
      ${className}
    `.trim();

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select 
            ref={ref} 
            className={selectClasses} 
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
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
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {hint && !error && (
          <p className="mt-1 text-sm text-stone-600" id={`${props.id}-hint`}>{hint}</p>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert" id={`${props.id}-error`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ==================== Textarea Component ====================

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = false, showCharCount, maxLength, className = '', value, ...props }, ref) => {
    const textareaClasses = `
      w-full px-4 py-3 border-2 rounded-lg bg-white
      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
      disabled:bg-stone-100 disabled:cursor-not-allowed
      resize-y min-h-[120px] transition-all
      ${error ? 'border-red-500 focus:ring-red-500' : 'border-stone-200'}
      ${className}
    `.trim();

    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea 
          ref={ref} 
          className={textareaClasses}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.id}-error` : hint ? `${props.id}-hint` : undefined}
          {...props}
        />

        <div className="flex justify-between items-center mt-1">
          <div>
            {hint && !error && (
              <p className="text-sm text-stone-600" id={`${props.id}-hint`}>{hint}</p>
            )}
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1" role="alert" id={`${props.id}-error`}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>
          
          {showCharCount && maxLength && (
            <p className="text-sm text-stone-600 font-medium" aria-live="polite">
              {charCount} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ==================== Checkbox Component ====================

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = '', ...props }, ref) => {
    return (
      <div>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              className="peer sr-only"
              {...props}
            />
            <div className="w-5 h-5 border-2 border-stone-300 rounded transition-all peer-checked:bg-gradient-to-br peer-checked:from-amber-400 peer-checked:to-yellow-600 peer-checked:border-amber-500 peer-focus:ring-2 peer-focus:ring-amber-500 peer-focus:ring-offset-2 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
            <svg
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 transition-colors">
              {label}
            </span>
            {description && (
              <p className="text-sm text-stone-600 mt-0.5">{description}</p>
            )}
          </div>
        </label>
        
        {error && (
          <p className="mt-1 text-sm text-red-600 ml-8 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ==================== Radio Component ====================

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  options,
  value,
  onChange,
  label,
  error,
  required,
}) => {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-stone-700 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="radio"
                id={`${name}-${option.value}`}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => onChange(e.target.value)}
                disabled={option.disabled}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-stone-300 rounded-full transition-all peer-checked:border-amber-500 peer-focus:ring-2 peer-focus:ring-amber-500 peer-focus:ring-offset-2 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-stone-700 group-hover:text-amber-700 transition-colors">
                {option.label}
              </span>
              {option.description && (
                <p className="text-sm text-stone-600 mt-0.5">{option.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

// ==================== Toggle Switch Component ====================

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  error?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, error, checked, className = '', ...props }, ref) => {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <label className="text-sm font-semibold text-stone-700">
              {label}
            </label>
            {description && (
              <p className="text-sm text-stone-600 mt-0.5">{description}</p>
            )}
          </div>
          
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer
              rounded-full border-2 border-transparent
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2
              disabled:cursor-not-allowed disabled:opacity-50
              ${checked ? 'bg-gradient-to-r from-amber-400 to-yellow-600' : 'bg-stone-300'}
              ${className}
            `.trim()}
            onClick={() => {
              const event = { target: { checked: !checked } } as any;
              props.onChange?.(event);
            }}
            disabled={props.disabled}
          >
            <span
              className={`
                inline-block h-5 w-5 transform rounded-full
                bg-white shadow-md ring-0 transition-all duration-200 ease-in-out
                ${checked ? 'translate-x-5 shadow-amber-500/30' : 'translate-x-0'}
              `.trim()}
            />
          </button>
          
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            className="sr-only"
            {...props}
          />
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

// ==================== File Upload Component ====================

export interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  onFilesChange: (files: File[]) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
  preview?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept,
  multiple = false,
  maxSize,
  onFilesChange,
  error,
  hint,
  disabled = false,
  preview = false,
}) => {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate file size
    if (maxSize) {
      const validFiles = fileArray.filter(file => {
        if (file.size > maxSize) {
          console.error(`File ${file.name} exceeds max size of ${maxSize} bytes`);
          return false;
        }
        return true;
      });
      
      setSelectedFiles(validFiles);
      onFilesChange(validFiles);
    } else {
      setSelectedFiles(fileArray);
      onFilesChange(fileArray);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-stone-700 mb-2">
          {label}
        </label>
      )}
      
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8
          transition-all cursor-pointer
          ${dragActive ? 'border-amber-500 bg-amber-50 scale-[1.02]' : 'border-stone-300 hover:border-amber-400 hover:bg-amber-50/30'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-500 bg-red-50' : ''}
        `.trim()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mt-3 text-sm font-semibold text-stone-700">
            Click to upload or drag and drop
          </p>
          {hint && <p className="mt-1 text-xs text-stone-600">{hint}</p>}
          {maxSize && (
            <p className="mt-1 text-xs text-stone-600">
              Max file size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-700">{file.name}</p>
                  <p className="text-xs text-stone-600">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const newFiles = selectedFiles.filter((_, i) => i !== index);
                  setSelectedFiles(newFiles);
                  onFilesChange(newFiles);
                }}
                className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};
