/**
 * Enhanced Table Component with Gold Theme
 * Professional data tables for admin and teacher interfaces
 */

import React, { ReactNode } from 'react';

// ============================================================================
// TABLE COMPONENTS
// ============================================================================

interface Column<T = any> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
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
}: TableProps<T>) {
  const paddingClass = compact ? 'px-4 py-2' : 'px-6 py-4';
  
  return (
    <div className={`overflow-x-auto rounded-xl border border-stone-200 ${className}`}>
      <table className="min-w-full divide-y divide-amber-200">
        <thead className="bg-gradient-to-r from-amber-50 to-yellow-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`${paddingClass} text-left text-xs font-semibold text-amber-900 uppercase tracking-wider ${column.width || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-stone-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-stone-700"
              >
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-12 h-12 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="font-medium">No data available</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`
                  ${hoverable ? 'hover:bg-amber-50 cursor-pointer transition-colors' : ''}
                  ${striped && index % 2 === 1 ? 'bg-stone-50' : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${paddingClass} text-sm text-stone-900`}
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
    <div className={`overflow-x-auto rounded-xl border border-stone-200 ${className}`}>
      <table className="min-w-full divide-y divide-amber-200">
        <thead className="bg-gradient-to-r from-amber-50 to-yellow-50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-amber-900 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-stone-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-amber-50 transition-colors">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 text-sm text-stone-900"
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
        <h2 className="text-2xl font-bold text-stone-900 font-heading">{title}</h2>
        {subtitle && <p className="text-stone-600 mt-1">{subtitle}</p>}
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
      <div className="text-sm text-stone-600">
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
          className="px-3 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {showPages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-stone-700">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all
                  ${page === currentPage
                    ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-md shadow-amber-500/50'
                    : 'border border-stone-300 text-stone-700 hover:bg-amber-50 hover:border-amber-300'
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
          className="px-3 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-amber-50 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-3 border-2 border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white text-stone-900 placeholder-stone-400"
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
