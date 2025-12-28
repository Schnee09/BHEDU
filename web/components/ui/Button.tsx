/**
 * Button Component - DUAL THEME
 * Light: Neumorphic soft buttons
 * Dark: Glassmorphism with glow
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  isLoading = false,
  disabled = false,
  icon,
  leftIcon,
  rightIcon,
  iconPosition = 'left',
  className = '',
  ...props
}: ButtonProps) {
  const isLoadingState = loading || isLoading;
  const actualLeftIcon = leftIcon || (icon && iconPosition === 'left' ? icon : null);
  const actualRightIcon = rightIcon || (icon && iconPosition === 'right' ? icon : null);

  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97] dark:focus:ring-offset-gray-900';

  const variantClasses = {
    primary: `
      bg-primary text-white hover:bg-primary-hover focus:ring-primary/50
      shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-lg)] hover:-translate-y-0.5
      dark:bg-primary dark:hover:bg-primary-hover
    `,
    secondary: `
      bg-surface text-foreground hover:bg-surface-hover border border-border-light
      shadow-sm hover:shadow-md hover:-translate-y-0.5
      dark:bg-surface-hover dark:hover:bg-surface-active dark:border-border-subtle
    `,
    outline: `
      border-2 border-primary text-primary hover:bg-primary-50 focus:ring-primary/50
      dark:border-primary dark:text-primary-300 dark:hover:bg-primary-900/20
    `,
    ghost: `
      text-muted hover:text-foreground hover:bg-surface-secondary
      dark:hover:bg-white/5
    `,
    danger: `
      bg-error text-white hover:bg-red-600 focus:ring-error/50
      shadow-lg shadow-red-500/20 hover:shadow-red-500/30 hover:-translate-y-0.5
    `,
    success: `
      bg-success text-white hover:bg-emerald-600 focus:ring-success/50
      shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || isLoadingState}
      {...props}
    >
      {isLoadingState && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!isLoadingState && actualLeftIcon}
      {children}
      {!isLoadingState && actualRightIcon}
    </button>
  );
}

/**
 * Icon Button - For icon-only actions
 */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: IconButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.95] dark:focus:ring-offset-gray-900';

  const variantClasses = {
    primary: `
      bg-primary text-white hover:bg-primary-hover focus:ring-primary/50
      shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-primary-lg)] hover:-translate-y-0.5
      dark:bg-primary dark:hover:bg-primary-hover
    `,
    secondary: `
      bg-surface text-foreground hover:bg-surface-hover border border-border-light
      shadow-sm hover:shadow-md hover:-translate-y-0.5
      dark:bg-surface-hover dark:hover:bg-surface-active dark:border-border-subtle
    `,
    ghost: `
      text-muted hover:text-foreground hover:bg-surface-secondary
      dark:hover:bg-white/5
    `,
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <button
      aria-label={ariaLabel}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {icon}
    </button>
  );
}

export default Button;

export { Button };
