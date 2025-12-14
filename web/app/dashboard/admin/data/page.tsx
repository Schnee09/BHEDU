"use client"

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { Card, CardBody } from "@/components/ui/Card"
import { Icons } from "@/components/ui/Icons"

type Pagination = { page: number; limit: number; total: number; pages: number }
type RowData = Record<string, unknown> & { id?: string | number }

export default function AdminDataViewerPage() {
  const [tables, setTables] = useState<string[]>([])
  const [table, setTable] = useState<string>('')
  const [rows, setRows] = useState<RowData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 1 })
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<RowData | null>(null)

  // Fetch allowed tables
  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/admin/data/tables')
        const json = await res.json()
        if (json.success) {
          setTables(json.data)
          if (!table && json.data.length) setTable(json.data[0])
        } else {
          setError(json.error || 'Failed to load tables')
        }
      } catch (err) {
        console.error('Failed to load tables', err)
        setError('Failed to load tables')
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch data
  useEffect(() => {
    if (!table) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ page: String(pagination.page), limit: String(pagination.limit) })
        const res = await apiFetch(`/api/admin/data/${table}?` + params.toString())
        const json = await res.json()
        if (json.success) {
          setRows(json.data)
          setPagination(json.pagination)
        } else {
          setError(json.error || 'Failed to load data')
        }
      } catch (err) {
        console.error('Failed to load data', err)
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [table, pagination.page, pagination.limit])

  const filtered = useMemo(() => {
    if (!q) return rows
    const needle = q.toLowerCase()
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(needle))
  }, [rows, q])

  const columns = useMemo(() => {
    if (filtered.length === 0) return [] as string[]
    const keys = new Set<string>()
    filtered.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)))
    // Put id first if present
    const arr = Array.from(keys)
    arr.sort((a, b) => {
      if (a === 'id') return -1
      if (b === 'id') return 1
      if (a === 'created_at') return -1
      if (b === 'created_at') return 1
      return a.localeCompare(b)
    })
    return arr
  }, [filtered])

  const startEdit = (row: Record<string, unknown>) => setEditing({ ...row })
  const cancelEdit = () => setEditing(null)

  const saveEdit = async () => {
    if (!editing || !table) return
    const id = editing.id
    try {
      setLoading(true)
      const res = await apiFetch(`/api/admin/data/${table}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing)
      })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to update')
      } else {
        // refresh current page
        setRows((prev) => prev.map((r) => (r.id === id ? json.data : r)))
        setEditing(null)
      }
    } catch (err) {
      console.error('Failed to update record', err)
      alert('Failed to update record')
    } finally {
      setLoading(false)
    }
  }

  const deleteRow = async (id: string | number) => {
    if (!confirm('Delete this record?')) return
    try {
      setLoading(true)
      const res = await apiFetch(`/api/admin/data/${table}?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) {
        alert(json.error || 'Failed to delete')
      } else {
        setRows((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete record', err)
      alert('Failed to delete record')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Icons.Chart className="w-8 h-8 text-blue-600" />
            Data Viewer
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">View and edit raw database tables</p>
        </div>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={table}
              onChange={(e) => { setTable(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
              className="pl-3 pr-10 py-2 border border-stone-300 dark:border-stone-600 rounded-lg appearance-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tables.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <Icons.ChevronDown className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            </div>
          </div>
          
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Search className="h-5 w-5 text-stone-400 dark:text-stone-500" />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter locally (JSON search)"
              className="w-full pl-10 pr-3 py-2 border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <select
              value={pagination.limit}
              onChange={(e) => setPagination((p) => ({ ...p, page: 1, limit: parseInt(e.target.value, 10) }))}
              className="pl-3 pr-10 py-2 border border-stone-300 dark:border-stone-600 rounded-lg appearance-none bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <Icons.ChevronDown className="w-4 h-4 text-stone-500 dark:text-stone-400" />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-stone-600 dark:text-stone-400 flex flex-col items-center">
                <Icons.Progress className="w-8 h-8 animate-spin mb-2 text-blue-600" />
                Loading data...
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-600 dark:text-red-400 flex flex-col items-center">
                <Icons.Error className="w-8 h-8 mb-2" />
                {error}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
                <thead className="bg-stone-50 dark:bg-stone-800">
                  <tr>
                    {columns.map((c) => (
                      <th key={c} className="px-6 py-3 text-left text-xs font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-right text-xs font-medium text-stone-600 dark:text-stone-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stone-800 divide-y divide-stone-200 dark:divide-stone-700">
                  {filtered.map((row, index) => (
                    <tr key={row.id ? String(row.id) : `row-${index}`} className="hover:bg-stone-50 dark:hover:bg-stone-700/50">
                      {columns.map((c) => (
                        <td key={c} className="px-6 py-4 whitespace-nowrap text-sm text-stone-800 dark:text-stone-200 max-w-xs truncate">
                          {editing && editing.id === row.id ? (
                            <input
                              className="w-full px-2 py-1 border border-stone-300 dark:border-stone-600 rounded bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              value={String(editing[c] ?? '')}
                              onChange={(e) => setEditing((prev) => prev ? { ...prev, [c]: e.target.value } : prev)}
                            />
                          ) : (
                            <span title={String(row[c] ?? '')}>{String(row[c] ?? '')}</span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editing && editing.id === row.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={saveEdit} className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                              <Icons.Save className="w-5 h-5" />
                            </button>
                            <button onClick={cancelEdit} className="text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-300">
                              <Icons.Close className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEdit(row)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                              <Icons.Edit className="w-5 h-5" />
                            </button>
                            <button onClick={() => deleteRow(row.id!)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                              <Icons.Delete className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-stone-600 dark:text-stone-400">
                        No data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Pagination */}
      {!loading && !error && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-600 dark:text-stone-400">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              className="px-3 py-1 border border-stone-300 dark:border-stone-600 rounded-md text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              className="px-3 py-1 border border-stone-300 dark:border-stone-600 rounded-md text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
