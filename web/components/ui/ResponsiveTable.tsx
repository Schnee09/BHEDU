'use client';

/**
 * ResponsiveTable Component
 * 
 * A wrapper that automatically converts tables to mobile-friendly card views.
 * This component can wrap existing tables to make them responsive.
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableProps {
    children: ReactNode;
    /** Alternative mobile view component */
    mobileView?: ReactNode;
    /** Class for the wrapper */
    className?: string;
}

/**
 * Wraps a table to show different views on mobile vs desktop
 */
export function ResponsiveTable({
    children,
    mobileView,
    className = ''
}: ResponsiveTableProps) {
    if (!mobileView) {
        // If no mobile view provided, just add horizontal scroll
        return (
            <div className={`overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 ${className}`}>
                {children}
            </div>
        );
    }

    return (
        <>
            {/* Mobile view */}
            <div className={`md:hidden ${className}`}>
                {mobileView}
            </div>
            {/* Desktop view */}
            <div className={`hidden md:block overflow-x-auto ${className}`}>
                {children}
            </div>
        </>
    );
}

/**
 * Mobile Card Item for table row
 */
interface MobileCardProps {
    title: ReactNode;
    subtitle?: ReactNode;
    fields: { label: string; value: ReactNode }[];
    actions?: ReactNode;
    onClick?: () => void;
    status?: {
        label: string;
        color: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
    };
    className?: string;
}

const statusColors = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function MobileCard({
    title,
    subtitle,
    fields,
    actions,
    onClick,
    status,
    className = '',
}: MobileCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(`
        bg-white dark:bg-[#1A1410] 
        border border-stone-200 dark:border-[#2C2420]
        rounded-2xl p-5
        shadow-sm active:scale-[0.98] transition-all
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        relative overflow-hidden
      `, className)}
        >
            {/* Top Shine (Subtle) */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight truncate">
                        {title}
                    </div>
                    {subtitle && (
                        <div className="text-sm text-stone-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 transition-colors">
                            {subtitle}
                        </div>
                    )}
                </div>
                {status && (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${statusColors[status.color]}`}>
                        {status.label}
                    </span>
                )}
            </div>

            {/* Fields */}
            <div className="space-y-3 bg-stone-50/50 dark:bg-white/5 rounded-xl p-3">
                {fields.map((field, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-stone-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{field.label}</span>
                        <span className="text-stone-800 dark:text-stone-200 font-semibold text-right">
                            {field.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            {actions && (
                <div className="flex gap-2 mt-5 pt-4 border-t border-stone-200 dark:border-[#2C2420]">
                    {actions}
                </div>
            )}
        </div>
    );
}

/**
 * Mobile Card List wrapper
 */
interface MobileCardListProps {
    children: ReactNode;
    className?: string;
}

export function MobileCardList({ children, className = '' }: MobileCardListProps) {
    return (
        <div className={`space-y-3 ${className}`}>
            {children}
        </div>
    );
}

/**
 * Table wrapper styles for built-in tables
 * Add this class to existing tables for better mobile UX
 */
export const tableWrapperClasses = `
  overflow-x-auto 
  -mx-4 px-4 
  sm:mx-0 sm:px-0 
  rounded-xl 
  border border-stone-200 dark:border-stone-700
  shadow-sm
`;

export const tableClasses = `
  min-w-full 
  divide-y divide-stone-200 dark:divide-stone-700
`;

export const theadClasses = `
  bg-stone-50 dark:bg-stone-800/50
`;

export const thClasses = `
  px-4 py-3 
  text-left text-xs font-semibold 
  text-stone-600 dark:text-stone-400 
  uppercase tracking-wider
  whitespace-nowrap
`;

export const tbodyClasses = `
  bg-white dark:bg-stone-900 
  divide-y divide-stone-200 dark:divide-stone-700
`;

export const trClasses = `
  hover:bg-stone-50 dark:hover:bg-stone-800/50 
  transition-colors
`;

export const tdClasses = `
  px-4 py-3 text-sm 
  text-stone-800 dark:text-stone-200
  whitespace-nowrap
`;

export default ResponsiveTable;
