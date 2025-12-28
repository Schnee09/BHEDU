/**
 * Enhanced Table Component - Clean Readable Design
 * Eye-friendly data tables for education platform
 */

import React, { ReactNode } from 'react';

// ============================================================================
// TABLE COMPONENTS - CLEAN READABLE STYLE
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
}: TableProps<T>) {
  const paddingClass = compact ? 'px-4 py-3' : 'px-6 py-4';

  // Mobile card view
  if (mobileCards && data.length > 0) {
    const primaryCol = columns.find(c => c.mobilePrimary) || columns[0];

    return (
      <>
        {/* Mobile Cards - shown on small screens */}
        <div className={`md:hidden space-y-3 ${className}`}>
          {data.map((row) => (
            <div
              key={keyExtractor(row)}
              onClick={() => onRowClick?.(row)}
              className={`bg-surface p-4 rounded-xl border border-border shadow-sm ${hoverable ? 'hover:bg-surface-hover cursor-pointer transition-colors' : ''
                }`}
            >
              {/* Primary field as header */}
              <div className="font-semibold text-foreground mb-2">
                {primaryCol.render ? primaryCol.render(row) : (row as any)[primaryCol.key]}
              </div>
              {/* Other fields */}
              <div className="space-y-1 text-sm text-muted">
                {columns.filter(c => c.key !== primaryCol.key && !c.mobileHidden).map((col) => (
                  <div key={col.key} className="flex justify-between">
                    <span className="text-muted">{col.header}:</span>
                    <span className="text-foreground">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table - hidden on small screens */}
        <div className={`hidden md:block overflow-x-auto rounded-xl border border-border shadow-sm ${className}`}>
          <table className="min-w-full">
            <thead className="bg-surface-secondary/50 border-b border-border">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`${paddingClass} text-left text-sm font-semibold text-muted font-heading uppercase tracking-wider ${column.width || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-gray-500 dark:text-[#9A9A9A]"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-[#3A3A3A] rounded-xl flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400 dark:text-[#757575]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="font-semibold text-lg text-gray-600 dark:text-[#C0C0C0]">No data available</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr
                    key={keyExtractor(row)}
                    onClick={() => onRowClick?.(row)}
                    className={`
                  ${hoverable ? 'hover:bg-surface-hover cursor-pointer transition-colors' : ''}
                  ${striped && index % 2 === 1 ? 'bg-surface-secondary/30' : ''}
                `}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`${paddingClass} text-sm font-medium text-foreground`}
                      >
                        {column.render
                          ? column.render(row)
                          : (row as any)[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // Regular table view (no mobileCards)
  return (
    <div className={`overflow-x-auto rounded-xl border border-border shadow-sm ${className}`}>
      <table className="min-w-full">
        <thead className="bg-surface-secondary/50 border-b border-border">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`${paddingClass} text-left text-sm font-semibold text-muted font-heading uppercase tracking-wider ${column.width || ''} ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-surface divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500 dark:text-[#9A9A9A]"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#3A3A3A] rounded-xl flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400 dark:text-[#757575]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="font-semibold text-lg text-gray-600 dark:text-[#C0C0C0]">No data available</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${hoverable ? 'hover:bg-surface-hover cursor-pointer transition-colors' : ''}
                  ${striped && index % 2 === 1 ? 'bg-surface-secondary/30' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${paddingClass} text-sm font-medium text-foreground ${column.mobileHidden ? 'hidden md:table-cell' : ''}`}
                  >
                    {column.render
                      ? column.render(row)
                      : (row as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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

export const SimpleTable: React.FC<SimpleTableProps> = ({
  headers,
  rows,
  className = '',
}) => {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-[#4A4A4A] ${className}`}>
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
            <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-[#3A3A3A] transition-colors">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 text-sm text-gray-800 dark:text-[#E8E8E8]"
                >
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

export const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  subtitle,
  action,
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#E8E8E8] font-heading">{title}</h2>
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

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages,
    ];
  };

  return (
    <div className="flex items-center justify-between mt-6 px-2">
      <div className="text-sm text-stone-600 dark:text-stone-400">
        {totalItems && itemsPerPage && (
          <span>
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-400 dark:hover:border-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {showPages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-stone-700 dark:text-stone-300">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  ${page === currentPage
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-md'
                    : 'border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-400 dark:hover:border-stone-500'
                  }
                `}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-400 dark:hover:border-stone-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
