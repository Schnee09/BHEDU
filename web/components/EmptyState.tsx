/**
 * Empty State Component - DUAL THEME
 * Use when there's no data to display
 */

import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  variant?: "default" | "compact";
}

// Default icons for common empty states
const EmptyIcons = {
  search: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  users: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  document: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  folder: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  notification: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  chart: (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
};

export { EmptyIcons };

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  variant = "default" 
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div className={`
      flex flex-col items-center justify-center text-center animate-fade-in
      ${isCompact ? 'py-8 px-4' : 'py-16 px-6'}
    `}>
      {/* Icon Container */}
      <div className={`
        flex items-center justify-center rounded-2xl
        bg-primary/10 text-primary/60 dark:bg-primary/20 dark:text-primary/70
        ${isCompact ? 'w-16 h-16 mb-4' : 'w-24 h-24 mb-6'}
        animate-bounce-subtle
      `}>
        <div className={isCompact ? 'w-8 h-8' : 'w-12 h-12'}>
          {icon || EmptyIcons.folder}
        </div>
      </div>

      {/* Title */}
      <h3 className={`
        font-semibold text-foreground font-heading
        ${isCompact ? 'text-lg' : 'text-xl'}
      `}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`
          text-muted max-w-sm
          ${isCompact ? 'text-sm mt-1' : 'mt-2'}
        `}>
          {description}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <div className={isCompact ? 'mt-4' : 'mt-6'}>
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200
                bg-primary text-white shadow-neumorphic-sm hover:shadow-neumorphic
                dark:shadow-glow-sm dark:hover:shadow-glow
                active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 cursor-pointer
                bg-primary text-white shadow-neumorphic-sm hover:shadow-neumorphic
                dark:shadow-glow-sm dark:hover:shadow-glow
                active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Search Empty State - when search returns no results
 */
export function SearchEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={EmptyIcons.search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try adjusting your search terms.`}
    />
  );
}

/**
 * Loading Skeleton for tables and lists
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border dark:border-white/10">
      {/* Header */}
      <div className="bg-surface-secondary dark:bg-white/5 px-6 py-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 rounded-full skeleton-shimmer flex-1" style={{ maxWidth: i === 0 ? '150px' : '100px' }} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-6 py-4 flex gap-4 border-t border-border/50 dark:border-white/5">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="h-4 rounded-full skeleton-shimmer flex-1" 
              style={{ 
                maxWidth: colIndex === 0 ? '150px' : '100px',
                animationDelay: `${(rowIndex * columns + colIndex) * 100}ms`
              }} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Grid Skeleton
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="p-6 rounded-xl border border-border dark:border-white/10 bg-surface dark:bg-white/5"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-20 rounded-full skeleton-shimmer" />
              <div className="h-8 w-16 rounded-lg skeleton-shimmer" />
            </div>
            <div className="w-14 h-14 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
