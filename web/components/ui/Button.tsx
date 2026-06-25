/**
 * Button Component - DUAL THEME
 * Light: Neumorphic soft buttons
 * Dark: Glassmorphism with glow
 */

import { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

type ButtonProps<T extends React.ElementType = 'button'> = BaseButtonProps & {
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, keyof BaseButtonProps | 'as'>;

const Button = <T extends React.ElementType = 'button'>({
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
  as,
  ...props
}: ButtonProps<T>) => {
  const Component = as || 'button';
  const isLoadingState = loading || isLoading;
  const actualLeftIcon = leftIcon || (icon && iconPosition === 'left' ? icon : null);
  const actualRightIcon = rightIcon || (icon && iconPosition === 'right' ? icon : null);

  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl md:rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.96] dark:focus:ring-offset-gray-900';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: `
      bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500/50
      shadow-sm hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-[1px]
      border border-amber-600/20
    `,
    secondary: `
      bg-stone-100 dark:bg-stone-850 text-stone-900 dark:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-stone-750/80
      border border-stone-200 dark:border-stone-700
      shadow-sm
    `,
    outline: `
      border border-stone-300 dark:border-white/15 bg-transparent
      text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/5
      hover:border-stone-400 dark:hover:border-white/30
    `,
    ghost: `
      text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/80 dark:hover:bg-white/5
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:ring-red-500/50
      shadow-sm hover:shadow-md hover:shadow-red-500/10 hover:-translate-y-[1px]
      border border-red-600/20
    `,
    success: `
      bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 focus:ring-emerald-500/50
      shadow-sm hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-[1px]
      border border-emerald-600/20
    `,
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm rounded-lg md:rounded-xl',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg rounded-2xl md:rounded-[20px]',
  };

  const componentProps = {
    className: `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`,
    disabled: disabled || isLoadingState,
    ...props,
  } as any;

  return (
    <Component {...componentProps}>
      {isLoadingState && (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
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
      )}
      {!isLoadingState && actualLeftIcon}
      {children}
      {!isLoadingState && actualRightIcon}
    </Component>
  );
};

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
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl md:rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.94] dark:focus:ring-offset-gray-900';

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 focus:ring-amber-500/50
      shadow-sm hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-[1px]
      border border-amber-600/20
    `,
    secondary: `
      bg-stone-100 dark:bg-stone-850 text-stone-900 dark:text-stone-100 hover:bg-stone-200/80 dark:hover:bg-stone-750/80
      border border-stone-200 dark:border-stone-700
      shadow-sm
    `,
    ghost: `
      text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100/80 dark:hover:bg-white/5
    `,
  };

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg md:rounded-xl',
    md: 'w-10 h-10',
    lg: 'w-12 h-12 rounded-2xl md:rounded-[20px]',
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
