/**
 * Badge Component - Swiss Modernism 2.0
 * Clean status indicators with proper color contrast
 */

import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  // Legacy color prop for backward compatibility
  color?: 'gray' | 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

export default function Badge({ 
  children, 
  variant,
  color,
  size = 'md',
  className = '' 
}: BadgeProps) {
  // Map legacy color prop to new variant system
  const effectiveVariant = variant || (() => {
    if (color === 'green') return 'success';
    if (color === 'red') return 'danger';
    if (color === 'blue') return 'info';
    if (color === 'yellow') return 'warning';
    return 'default';
  })();

  const baseClasses = 'inline-flex items-center font-medium rounded-full';

  const variantClasses = {
    default: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
    warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    danger: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
    info: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[effectiveVariant]} ${sizeClasses[size]} ${className}`}>
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
