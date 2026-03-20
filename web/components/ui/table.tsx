import React, { ReactNode } from 'react';
import { EmptyState } from './EmptyState';
import { SkeletonTable } from './skeleton';
import { cn } from '@/lib/utils';

// ============================================================================
// TABLE COMPONENTS - PREMIUM DATA PRESENTATION
// ============================================================================

interface Column<T = any> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  /** Hide this column on mobile screens */
  mobileHidden?: boolean;
  /** Use as primary display in mobile card view */
  mobilePrimary?: boolean;
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  hoverable?: boolean;
  striped?: boolean;
  compact?: boolean;
  className?: string;
  /** Show stacked cards on mobile instead of table */
  mobileCards?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export function Table<T = any>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  hoverable = true,
  striped = false,
  compact = false,
  className = '',
  mobileCards = false,
  loading = false,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription,
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
}: TableProps<T>) {
  const paddingClass = compact ? 'px-4 py-3' : 'px-6 py-4';

  if (loading) {
    return (
      <div
        className={cn(
          'bg-white dark:bg-stone-900/40 rounded-[32px] p-6 border border-stone-200 dark:border-white/10 shadow-xl overflow-hidden',
          className
        )}
      >
        <SkeletonTable rows={5} columns={columns.length} />
      </div>
    );
  }

  // No data case
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className={className}
      />
    );
  }

  const primaryCol = columns.find((c) => c.mobilePrimary) || columns[0];

  return (
    <div className={cn('relative', className)}>
      {/* Mobile view - Cards */}
      {mobileCards && (
        <div className="md:hidden space-y-4">
          {data.map((row) => (
            <div
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'bg-white dark:bg-stone-900/60 p-6 rounded-[24px] border border-stone-100 dark:border-white/5 shadow-md active:scale-[0.98] transition-all',
                hoverable && 'hover:border-amber-500/30 cursor-pointer'
              )}
            >
              <div className="font-black text-stone-900 dark:text-white mb-4 text-base uppercase tracking-tight">
                {primaryCol &&
                  (primaryCol.render ? primaryCol.render(row) : (row as any)[primaryCol.key])}
              </div>
              <div className="space-y-3">
                {columns
                  .filter((c) => c.key !== (primaryCol?.key || '') && !c.mobileHidden)
                  .map((col) => (
                    <div key={col.key} className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500">
                        {col.header}
                      </span>
                      <span className="text-sm font-bold text-stone-700 dark:text-stone-200">
                        {col.render ? col.render(row) : (row as any)[col.key]}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop view - Table */}
      <div
        className={cn(
          'overflow-hidden rounded-[32px] bg-white dark:bg-stone-900/40 border border-stone-200 dark:border-white/10 shadow-xl',
          mobileCards ? 'hidden md:block' : 'block'
        )}
      >
        <table className="min-w-full border-collapse">
          <thead className="bg-stone-50/50 dark:bg-stone-800/20">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    paddingClass,
                    'text-left text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-white/5',
                    column.width || '',
                    column.mobileHidden && 'hidden md:table-cell'
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-white/5">
            {data.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'group transition-all duration-300',
                  hoverable && 'hover:bg-amber-50/30 dark:hover:bg-amber-500/5 cursor-pointer',
                  striped && index % 2 === 1 && 'bg-stone-50/30 dark:bg-white/[0.02]'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      paddingClass,
                      'text-sm font-bold text-stone-700 dark:text-stone-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors',
                      column.mobileHidden && 'hidden md:table-cell'
                    )}
                  >
                    {column.render ? column.render(row) : (row as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLE TABLE (for quick implementation)
// ============================================================================

interface SimpleTableProps {
  headers: string[];
  rows: (string | number | ReactNode)[][];
  className?: string;
}

export const SimpleTable: React.FC<SimpleTableProps> = ({ headers, rows, className = '' }) => {
  return (
    <div
      className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-[#4A4A4A] ${className}`}
    >
      <table className="min-w-full divide-y divide-gray-200 dark:divide-[#4A4A4A]">
        <thead className="bg-gray-50 dark:bg-[#252525]">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-[#C0C0C0] uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-[#2D2D2D] divide-y divide-gray-200 dark:divide-[#3A3A3A]">
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-gray-50 dark:hover:bg-[#3A3A3A] transition-colors"
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-6 py-4 text-sm text-gray-800 dark:text-[#E8E8E8]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// TABLE UTILITIES
// ============================================================================

interface TableHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8E8E8] font-heading">
          {title}
        </h2>
        {subtitle && <p className="text-gray-600 dark:text-[#9A9A9A] mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const showPages = () => {
    if (totalPages <= 7) return pages;

    if (currentPage <= 3) {
      return [...pages.slice(0, 5), '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', ...pages.slice(totalPages - 5)];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
      <div className="text-sm text-stone-600 dark:text-stone-400 order-2 sm:order-1 text-center sm:text-left">
        {totalItems && itemsPerPage && (
          <span>
            {currentPage === 1 ? '1' : (currentPage - 1) * itemsPerPage + 1} -{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          {showPages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="w-8 text-center text-stone-700 dark:text-stone-300 hidden sm:inline">
                  ...
                </span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className={`
                    min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 rounded-lg font-medium transition-all text-sm
                    ${
                      page === currentPage
                        ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md'
                        : 'border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700'
                    }
                    ${typeof page === 'number' && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages ? 'hidden sm:flex items-center justify-center' : 'flex items-center justify-center'}
                  `}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// TABLE FILTERS
// ============================================================================

interface TableFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 relative">
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500 dark:text-stone-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 border-2 border-stone-200 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-400 transition-all bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500"
        />
      </div>
      {filters && <div className="flex gap-2">{filters}</div>}
    </div>
  );
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default Table;

SimpleTable.displayName = 'SimpleTable';
TableHeader.displayName = 'TableHeader';
TablePagination.displayName = 'TablePagination';
TableFilters.displayName = 'TableFilters';
