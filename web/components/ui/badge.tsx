/**
 * Badge Component - Swiss Modernism 2.0
 * Clean status indicators with proper color contrast
 */

import { ReactNode, CSSProperties } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'blue' | 'gold' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
  // Legacy color prop for backward compatibility
  color?: 'gray' | 'blue' | 'green' | 'red' | 'yellow';
}

export default function Badge({
  children,
  variant,
  color,
  size = 'md',
  className = '',
  style
}: BadgeProps) {
  // Map legacy color prop to new variant system
  const effectiveVariant: NonNullable<BadgeProps['variant']> = variant || (() => {
    if (color === 'green') return 'success';
    if (color === 'red') return 'danger';
    if (color === 'blue') return 'info';
    if (color === 'yellow') return 'warning';
    return 'default';
  })();

  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
    default: 'bg-surface-secondary text-muted-foreground border border-border',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    blue: 'bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
    gold: 'bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
    secondary: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`${baseClasses} ${variantClasses[effectiveVariant]} ${sizeClasses[size]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

export { Badge }

/**
 * Status Dot - Minimal status indicator
 */
interface StatusDotProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  label?: string;
  className?: string;
}

export function StatusDot({ variant = 'default', label, className = '' }: StatusDotProps) {
  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} aria-hidden="true" />
      {label && <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>}
    </div>
  );
}
