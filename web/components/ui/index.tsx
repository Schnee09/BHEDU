/**
 * Reusable UI Components Library for BH-EDU
 * DUAL THEME DESIGN SYSTEM
 * Light: Wellness/Neumorphic - Soft, Calming
 * Dark: Fintech/Glassmorphism - Modern, Tech
 */

import React, { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Export skeleton components
export * from './skeleton';

// Export card components
export * from './Card';

// Export badge components
export * from './badge';

// Export table components
export * from './table';

// Export form field components
export { FormInput, FormTextarea, FormSelect, FormGroup, FormRow, FormActions } from './FormField';

// Export mobile-first components (Cross-Platform)
export {
  MobileCard,
  MobileCardList,
  MobileCardField,
  MobileCardHeader,
  MobileCardActions,
} from './MobileCard';
export { SwipeContainer, SwipeView } from './SwipeContainer';

// Export UI/UX upgrade components
export { PageHeader, PageSection, SimpleBreadcrumb } from './PageHeader';
export { GlowCard, GradientCard, LiveIndicatorCard, MetricCard } from './EnhancedCards';
export { IllustratedEmptyState, NoDataCard } from './IllustratedEmptyState';

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
    gold: 'bg-amber-600 text-white hover:bg-amber-500 shadow-[0_4px_12px_rgba(217,119,6,0.2)] hover:shadow-[0_6px_20px_rgba(217,119,6,0.3)] hover:scale-[1.02] active:scale-[0.98] focus:ring-amber-500/50 dark:bg-amber-500 dark:hover:bg-amber-400 dark:shadow-[0_0_20px_rgba(217,119,6,0.2)]',
    primary:
      'bg-primary text-white hover:bg-stone-800 shadow-[0_4px_12px_rgba(24,24,27,0.15)] hover:shadow-[0_6px_20px_rgba(24,24,27,0.2)] hover:scale-[1.02] active:scale-[0.98] focus:ring-primary/50 dark:bg-white dark:text-stone-950 dark:hover:bg-stone-200 dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
    secondary:
      'bg-transparent text-stone-900 hover:bg-stone-100 border border-stone-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] focus:ring-primary/20 dark:text-white dark:hover:bg-white/5 dark:border-white/10 dark:shadow-none',
    danger:
      'bg-red-600 text-white hover:bg-red-500 shadow-[0_4px_12px_rgba(225,29,72,0.2)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.3)] hover:scale-[1.02] active:scale-[0.98] focus:ring-red-500/50 dark:shadow-[0_0_20px_rgba(225,29,72,0.2)]',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_4px_12px_rgba(5,150,105,0.2)] hover:shadow-[0_6px_20px_rgba(5,150,105,0.3)] hover:scale-[1.02] active:scale-[0.98] focus:ring-emerald-500/50 dark:shadow-[0_0_20px_rgba(5,150,105,0.2)]',
    outline:
      'border-2 border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white hover:scale-[1.02] active:scale-[0.98] focus:ring-primary/50 dark:border-white/50 dark:text-white dark:hover:bg-white dark:hover:text-stone-950',
    ghost:
      'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5 hover:scale-[1.02] active:scale-[0.98] focus:ring-primary/10',
  };

  const sizes = {
    sm: 'h-10 px-4 py-2 text-sm gap-2 min-w-[40px]',
    md: 'h-12 px-6 py-2.5 text-base gap-2 min-w-[44px]',
    lg: 'h-14 px-8 py-3.5 text-lg gap-3 min-w-[48px]',
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
      )}
      {!isLoading && leftIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {!isLoading && rightIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

// ============================================================================
// LOADING STATES
// ============================================================================

// ============================================================================
// LOADING STATES
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
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
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <LoadingSpinner size="lg" />
      <p
        className="mt-4 text-stone-900 dark:text-stone-300 font-bold"
        style={{ fontFamily: 'var(--font-sans), sans-serif' }}
      >
        {message}
      </p>
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
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 bg-stone-50 dark:bg-white/5 border border-dashed border-stone-200 dark:border-white/10 rounded-2xl ${className}`}
    >
      {icon && (
        <div className="mb-4 text-stone-500 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-xl shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-serif font-bold text-stone-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-stone-500 dark:text-stone-400 text-center max-w-md mb-4 font-medium">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// ============================================================================
// ALERT/NOTIFICATION COMPONENTS - NEUBRUTALISM STYLE
// ============================================================================

type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message?: string;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  message,
  children,
  onClose,
  className = '',
}) => {
  const variants = {
    info: {
      bg: 'bg-stone-50 dark:bg-stone-900/50 text-stone-900 dark:text-stone-300',
      icon: 'ℹ️',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300',
      icon: '✅',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
      icon: '⚠️',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      icon: '🚨',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      icon: '❌',
    },
  };

  const style = variants[variant];
  const content = message || children;

  return (
    <div
      className={cn(
        style.bg,
        'border border-stone-200/50 dark:border-white/10 rounded-xl p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start">
        <span className="text-2xl mr-3">{style.icon}</span>
        <div className="flex-1">
          {title && <h4 className="font-serif font-bold mb-1">{title}</h4>}
          <div className="text-sm font-medium">{content}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 opacity-50 hover:opacity-100 transition-opacity font-bold text-lg cursor-pointer"
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
        <label
          className="block text-sm font-bold text-stone-900 dark:text-stone-300 mb-2"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">{leftIcon}</div>
        )}

        <input
          className={cn(
            'w-full px-4 py-3 border border-stone-200 dark:border-white/10 rounded-xl font-medium bg-white dark:bg-white/5',
            'text-stone-900 dark:text-white placeholder:text-stone-500 dark:placeholder:text-stone-400',
            'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            !!leftIcon && 'pl-12',
            !!rightIcon && 'pr-12',
            hasError && 'border-red-500 focus:ring-red-500/20',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
            {rightIcon}
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 font-medium">{hint}</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600 font-bold">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  className = '',
  ...props
}) => {
  const hasError = Boolean(error);

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-bold text-stone-900 dark:text-stone-300 mb-2"
          style={{ fontFamily: 'var(--font-sans), sans-serif' }}
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        className={cn(
          'w-full px-4 py-3 border border-stone-200 dark:border-white/10 rounded-xl font-medium bg-white dark:bg-white/5',
          'text-stone-900 dark:text-white placeholder:text-stone-500 dark:placeholder:text-stone-400',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed min-h-[120px] resize-y',
          hasError && 'border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />

      {hint && !error && (
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400 font-medium">{hint}</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600 font-bold">{error}</p>}
    </div>
  );
};

// Table components are exported from ./table at the top of this file

// ============================================================================
// MODAL COMPONENTS - PREMIUM DUAL THEME STYLE
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) => {
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop with blur */}
      <div
        className={`
          fixed inset-0 transition-all duration-200
          bg-black/60 backdrop-blur-sm
          dark:bg-black/70 dark:backdrop-blur-md
          ${isClosing ? 'opacity-0' : 'animate-backdrop-enter'}
        `}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:items-center items-end sm:items-center">
        <div
          className={`
            relative w-full ${sizes[size]}
            ${isClosing ? 'animate-modal-exit' : 'animate-modal-enter'}
            
            /* Premium Academic Crystal Style */
            glass-crystal rounded-3xl overflow-hidden
            shadow-ultra
            ${className}
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="
            flex items-center justify-between px-8 py-5
            border-b border-stone-200/50 dark:border-white/5
            bg-white/50 dark:bg-black/20
            rounded-t-3xl
          "
          >
            <h3
              id="modal-title"
              className="text-xl font-serif font-bold text-stone-900 dark:text-white italic"
            >
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="
                p-2 rounded-xl transition-all duration-200 cursor-pointer
                text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white
                hover:bg-gray-100 dark:hover:bg-gray-700/50
                hover:scale-110 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600
              "
              aria-label="Đóng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[65vh] overflow-y-auto">{children}</div>

          {/* Footer */}
          {footer && (
            <div
              className="
              px-8 py-5 
              border-t border-stone-200/50 dark:border-white/5
              bg-white/30 dark:bg-black/10
              rounded-b-3xl 
              flex gap-3 justify-end
            "
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
Button.displayName = 'Button';
LoadingSpinner.displayName = 'LoadingSpinner';
LoadingState.displayName = 'LoadingState';
EmptyState.displayName = 'EmptyState';
Alert.displayName = 'Alert';
Input.displayName = 'Input';
Textarea.displayName = 'Textarea';
Modal.displayName = 'Modal';
