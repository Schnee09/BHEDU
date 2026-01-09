'use client'

/**
 * Responsive Table Component
 * 
 * Mobile-friendly table with:
 * - Horizontal scroll
 * - Sticky first column option
 * - Card view on mobile option
 */

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, Bars3Icon, TableCellsIcon } from '@heroicons/react/24/outline'

interface Column<T> {
    key: keyof T | string
    header: string
    sticky?: boolean
    width?: string
    render?: (value: any, row: T) => React.ReactNode
    className?: string
    sortable?: boolean
}

interface ResponsiveTableProps<T> {
    data: T[]
    columns: Column<T>[]
    keyField?: keyof T
    emptyMessage?: string
    loading?: boolean
    onRowClick?: (row: T) => void
    cardViewOnMobile?: boolean
    className?: string
}

export default function ResponsiveTable<T extends Record<string, any>>({
    data,
    columns,
    keyField = 'id' as keyof T,
    emptyMessage = 'Không có dữ liệu',
    loading = false,
    onRowClick,
    cardViewOnMobile = true,
    className = ''
}: ResponsiveTableProps<T>) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

    // Sort data
    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0
        const aVal = a[sortConfig.key]
        const bVal = b[sortConfig.key]

        if (aVal === bVal) return 0
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        const comparison = aVal < bVal ? -1 : 1
        return sortConfig.direction === 'asc' ? comparison : -comparison
    })

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                if (prev.direction === 'asc') return { key, direction: 'desc' }
                return null
            }
            return { key, direction: 'asc' }
        })
    }

    const getValue = (row: T, key: string) => {
        const keys = key.split('.')
        let value: any = row
        for (const k of keys) {
            value = value?.[k]
        }
        return value
    }

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-2" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded mb-1" />
                ))}
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className={className}>
            {/* View Mode Toggle (Mobile) */}
            {cardViewOnMobile && (
                <div className="flex justify-end gap-2 mb-3 md:hidden">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <TableCellsIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`p-2 rounded ${viewMode === 'cards' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
                    >
                        <Bars3Icon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Card View (Mobile) */}
            {viewMode === 'cards' && cardViewOnMobile && (
                <div className="md:hidden space-y-3">
                    {sortedData.map((row, rowIndex) => (
                        <div
                            key={String(row[keyField]) || rowIndex}
                            onClick={() => onRowClick?.(row)}
                            className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        >
                            {columns.map((col, colIndex) => {
                                const value = getValue(row, col.key as string)
                                return (
                                    <div key={colIndex} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                                        <span className="text-sm text-gray-500 font-medium">{col.header}</span>
                                        <span className="text-sm text-gray-900 font-medium text-right">
                                            {col.render ? col.render(value, row) : value ?? '-'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* Table View */}
            <div className={`${viewMode === 'cards' && cardViewOnMobile ? 'hidden md:block' : ''}`}>
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                <tr>
                                    {columns.map((col, index) => (
                                        <th
                                            key={index}
                                            onClick={() => col.sortable && handleSort(col.key as string)}
                                            className={`
                        px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider
                        ${col.sticky ? 'sticky left-0 bg-gray-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}
                        ${col.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                        ${col.className || ''}
                      `}
                                            style={{ width: col.width }}
                                        >
                                            <div className="flex items-center gap-1">
                                                {col.header}
                                                {col.sortable && sortConfig?.key === col.key && (
                                                    sortConfig.direction === 'asc'
                                                        ? <ChevronUpIcon className="w-4 h-4" />
                                                        : <ChevronDownIcon className="w-4 h-4" />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {sortedData.map((row, rowIndex) => (
                                    <tr
                                        key={String(row[keyField]) || rowIndex}
                                        onClick={() => onRowClick?.(row)}
                                        className={`
                      hover:bg-gray-50 transition-colors
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                                    >
                                        {columns.map((col, colIndex) => {
                                            const value = getValue(row, col.key as string)
                                            return (
                                                <td
                                                    key={colIndex}
                                                    className={`
                            px-4 py-3 text-sm text-gray-900 whitespace-nowrap
                            ${col.sticky ? 'sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]' : ''}
                            ${col.className || ''}
                          `}
                                                >
                                                    {col.render ? col.render(value, row) : value ?? '-'}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
