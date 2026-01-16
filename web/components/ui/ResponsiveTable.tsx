'use client';

/**
 * ResponsiveTable Component
 * 
 * A wrapper that automatically converts tables to mobile-friendly card views.
 * This component can wrap existing tables to make them responsive.
 */

import React, { ReactNode } from 'react';

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
}: MobileCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        bg-white dark:bg-stone-800 
        border border-stone-200 dark:border-stone-700 
        rounded-xl p-4 
        shadow-sm hover:shadow-md 
        transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
      `}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {title}
                    </div>
                    {subtitle && (
                        <div className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                            {subtitle}
                        </div>
                    )}
                </div>
                {status && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${statusColors[status.color]}`}>
                        {status.label}
                    </span>
                )}
            </div>

            {/* Fields */}
            <div className="space-y-2">
                {fields.map((field, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-stone-500 dark:text-stone-400">{field.label}</span>
                        <span className="text-stone-800 dark:text-stone-200 font-medium text-right">
                            {field.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Actions */}
            {actions && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-stone-200 dark:border-stone-700">
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
