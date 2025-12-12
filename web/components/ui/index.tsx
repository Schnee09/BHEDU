/**
 * Reusable UI Components Library for BH-EDU
 * DUAL THEME DESIGN SYSTEM
 * Light: Wellness/Neumorphic - Soft, Calming
 * Dark: Fintech/Glassmorphism - Modern, Tech
 */

import React, { ReactNode } from 'react';

// Export skeleton components
export * from './skeleton';

// Export table components
export * from './table';

// Export form field components
export { FormInput, FormTextarea, FormSelect, FormGroup, FormRow, FormActions } from './FormField';

// ============================================================================
// BUTTON COMPONENTS - DUAL THEME STYLE
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = `inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`;
  
  const variants = {
    gold: 'bg-warning text-white hover:bg-warning/90 shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.4)] focus:ring-warning/50 dark:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    primary: 'bg-primary text-white hover:bg-primary/90 shadow-[0_4px_12px_rgba(22,163,74,0.3)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.4)] focus:ring-primary/50 dark:shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    secondary: 'bg-surface-secondary text-foreground hover:bg-surface border border-border shadow-neumorphic-xs hover:shadow-neumorphic-sm focus:ring-primary/30 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:shadow-none',
    danger: 'bg-error text-white hover:bg-error/90 shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] focus:ring-error/50 dark:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    success: 'bg-success text-white hover:bg-success/90 shadow-[0_4px_12px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] focus:ring-success/50 dark:shadow-[0_0_20px_rgba(34,197,94,0.4)]',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 focus:ring-primary/50 dark:border-primary/50 dark:hover:bg-primary/20 dark:hover:border-primary',
    ghost: 'text-muted hover:text-foreground hover:bg-surface-secondary focus:ring-primary/30 dark:hover:bg-white/10',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-2.5 text-base gap-2',
    lg: 'px-8 py-3.5 text-lg gap-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      style={{ fontFamily: 'Fredoka, sans-serif' }}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoading && leftIcon && <span className="flex-shrink-0" aria-hidden="true">{leftIcon}</span>}
      {children}
      {!isLoading && rightIcon && <span className="flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
};

// ============================================================================
// CARD COMPONENTS - NEUBRUTALISM STYLE
// ============================================================================

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass' | 'primary' | 'secondary' | 'accent';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  hover = false,
  variant = 'default',
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const variants = {
    default: 'bg-surface border border-border shadow-neumorphic-sm rounded-2xl dark:bg-glass-bg dark:backdrop-blur-xl dark:border-white/10 dark:shadow-none',
    elevated: 'bg-surface border border-border shadow-neumorphic rounded-2xl dark:bg-glass-bg dark:backdrop-blur-xl dark:border-white/10 dark:shadow-glow-sm',
    outlined: 'bg-surface border-2 border-primary shadow-[0_4px_12px_rgba(22,163,74,0.2)] rounded-2xl dark:bg-glass-bg dark:border-primary/50 dark:shadow-glow-sm',
    glass: 'bg-surface/80 backdrop-blur-sm border border-border shadow-neumorphic-sm rounded-2xl dark:bg-glass-bg dark:backdrop-blur-2xl dark:border-white/10 dark:shadow-glow',
    primary: 'bg-primary/5 border border-primary/20 shadow-neumorphic-sm rounded-2xl dark:bg-primary/10 dark:border-primary/30 dark:shadow-[0_0_15px_rgba(6,182,212,0.2)]',
    secondary: 'bg-success/5 border border-success/20 shadow-neumorphic-sm rounded-2xl dark:bg-success/10 dark:border-success/30 dark:shadow-[0_0_15px_rgba(34,197,94,0.2)]',
    accent: 'bg-accent/5 border border-accent/20 shadow-neumorphic-sm rounded-2xl dark:bg-accent/10 dark:border-accent/30 dark:shadow-[0_0_15px_rgba(139,92,246,0.2)]',
  };
  
  const hoverClass = hover ? 'transition-all duration-200 hover:shadow-neumorphic dark:hover:shadow-glow hover:border-primary/30 dark:hover:border-primary/50 cursor-pointer' : '';
  
  return (
    <div className={`${variants[variant]} ${paddings[padding]} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-xl font-bold text-foreground font-heading">{title}</h3>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

// ============================================================================
// BADGE COMPONENTS - DUAL THEME STYLE
// ============================================================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30',
    success: 'bg-success/10 text-success border-success/20 dark:bg-success/20 dark:border-success/30',
    warning: 'bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:border-warning/30',
    danger: 'bg-error/10 text-error border-error/20 dark:bg-error/20 dark:border-error/30',
    info: 'bg-info/10 text-info border-info/20 dark:bg-info/20 dark:border-info/30',
  };
  
  return (
    <span 
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// ============================================================================
// LOADING STATES
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  return (
    <svg
      className={`animate-spin text-primary dark:text-primary ${sizes[size]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-indigo-700 font-semibold" style={{ fontFamily: 'Fredoka, sans-serif' }}>{message}</p>
    </div>
  );
};

// ============================================================================
// EMPTY STATES - NEUBRUTALISM STYLE
// ============================================================================

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-indigo-50 border-3 border-dashed border-indigo-300 rounded-2xl">
      {icon && <div className="mb-4 text-indigo-500 p-4 bg-white border-3 border-black rounded-xl shadow-[4px_4px_0px_#000]">{icon}</div>}
      <h3 className="text-xl font-bold text-indigo-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>{title}</h3>
      {description && <p className="text-indigo-700 text-center max-w-md mb-4 font-medium">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// ============================================================================
// ALERT/NOTIFICATION COMPONENTS - NEUBRUTALISM STYLE
// ============================================================================

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const variants = {
    info: {
      bg: 'bg-cyan-100',
      border: 'border-black',
      shadow: 'shadow-[4px_4px_0px_#0891B2]',
      text: 'text-cyan-900',
      icon: '�',
    },
    success: {
      bg: 'bg-emerald-100',
      border: 'border-black',
      shadow: 'shadow-[4px_4px_0px_#059669]',
      text: 'text-emerald-900',
      icon: '✅',
    },
    warning: {
      bg: 'bg-amber-100',
      border: 'border-black',
      shadow: 'shadow-[4px_4px_0px_#D97706]',
      text: 'text-amber-900',
      icon: '⚠️',
    },
    error: {
      bg: 'bg-red-100',
      border: 'border-black',
      shadow: 'shadow-[4px_4px_0px_#DC2626]',
      text: 'text-red-900',
      icon: '❌',
    },
  };
  
  const style = variants[variant];
  
  return (
    <div className={`${style.bg} ${style.border} border-3 rounded-xl p-4 ${style.shadow} ${className}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3">{style.icon}</span>
        <div className="flex-1">
          {title && <h4 className={`font-bold ${style.text} mb-1`} style={{ fontFamily: 'Fredoka, sans-serif' }}>{title}</h4>}
          <p className={`${style.text} text-sm font-medium`}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`ml-4 ${style.text} hover:opacity-70 font-bold text-lg cursor-pointer`}
            aria-label="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// FORM INPUT COMPONENTS - NEUBRUTALISM STYLE
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const hasError = Boolean(error);
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-indigo-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600">
            {leftIcon}
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-3 border-3 border-black rounded-xl font-medium
            ${leftIcon ? 'pl-12' : ''}
            ${rightIcon ? 'pr-12' : ''}
            ${hasError ? 'border-red-500 shadow-[4px_4px_0px_#DC2626] focus:shadow-[6px_6px_0px_#DC2626]' : 'shadow-[4px_4px_0px_#000] focus:shadow-[6px_6px_0px_#000]'}
            focus:outline-none focus:translate-x-[-2px] focus:translate-y-[-2px]
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
            placeholder:text-indigo-400 text-indigo-900
            transition-all duration-150
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-600">
            {rightIcon}
          </div>
        )}
      </div>
      
      {hint && !error && (
        <p className="mt-2 text-sm text-indigo-600 font-medium">{hint}</p>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 font-bold">{error}</p>
      )}
    </div>
  );
};

// ============================================================================
// TABLE COMPONENTS - NEUBRUTALISM STYLE
// ============================================================================

interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data found',
  isLoading = false,
  onRowClick,
}: TableProps<T>) {
  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-indigo-700 font-semibold bg-indigo-50 border-3 border-dashed border-indigo-300 rounded-2xl">
        {emptyMessage}
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto border-3 border-black rounded-2xl shadow-[6px_6px_0px_#000]">
      <table className="min-w-full">
        <thead className="bg-indigo-100 border-b-3 border-black">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`px-6 py-4 text-${column.align || 'left'} text-sm font-bold text-indigo-900 uppercase tracking-wider`}
                style={{ ...column.width ? { width: column.width } : undefined, fontFamily: 'Fredoka, sans-serif' }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y-2 divide-indigo-100">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'hover:bg-amber-50 cursor-pointer transition-colors' : 'hover:bg-indigo-50'}
            >
              {columns.map((column, idx) => (
                <td
                  key={idx}
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-900 text-${column.align || 'left'}`}
                >
                  {column.render
                    ? column.render(item)
                    : String((item as any)[column.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// MODAL COMPONENTS - NEUBRUTALISM STYLE
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal - Neubrutalism Style */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0px_#000] w-full ${sizes[size]} animate-scale-in`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b-3 border-black bg-indigo-100 rounded-t-xl">
            <h3 id="modal-title" className="text-xl font-bold text-indigo-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>{title}</h3>
            <button
              onClick={onClose}
              className="text-indigo-900 hover:text-red-600 transition-colors p-2 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] hover:shadow-[3px_3px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] focus:outline-none cursor-pointer"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t-3 border-black bg-amber-50 rounded-b-xl flex gap-3 justify-end">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
