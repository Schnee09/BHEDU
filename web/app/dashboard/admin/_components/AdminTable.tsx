'use client';

import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface AdminTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSelect?: (item: T) => void;
  selectable?: boolean;
  selectedIds?: string[];
  emptyMessage?: string;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: keyof T, order: 'asc' | 'desc') => void;
}

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  onEdit,
  onDelete,
  onSelect,
  selectable = false,
  selectedIds = [],
  emptyMessage = 'No records found',
  sortBy,
  sortOrder = 'asc',
  onSort,
}: AdminTableProps<T>) {
  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !onSort) return;
    const newOrder = sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked || !onSelect) return;
    data.forEach(item => onSelect(item));
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full" />
        </div>
      )}

      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {selectable && (
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-sm font-semibold text-gray-900"
                style={{ width: column.width }}
              >
                <button
                  onClick={() => handleSort(column)}
                  className={`flex items-center gap-2 ${
                    column.sortable ? 'cursor-pointer hover:text-gray-600' : ''
                  }`}
                >
                  {column.label}
                  {column.sortable && sortBy === column.key && (
                    sortOrder === 'asc' ? (
                      <ChevronUpIcon className="w-4 h-4" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4" />
                    )
                  )}
                </button>
              </th>
            ))}
            {(onEdit || onDelete) && <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={(selectable ? 1 : 0) + columns.length + (onEdit || onDelete ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {selectable && (
                  <td className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => onSelect?.(item)}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-3 text-sm text-gray-900"
                    style={{ width: column.width }}
                  >
                    {column.render
                      ? column.render(item[column.key], item)
                      : String(item[column.key] || '-')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-3 text-right space-x-2 flex justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
