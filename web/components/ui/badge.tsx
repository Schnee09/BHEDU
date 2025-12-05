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
    default: 'bg-slate-100 text-slate-700 border border-slate-200',
    success: 'bg-green-100 text-green-700 border border-green-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    info: 'bg-blue-100 text-blue-700 border border-blue-200',
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
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </div>
  );
}
