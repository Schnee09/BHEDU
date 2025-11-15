"use client"

import { useEffect, useMemo, useState } from 'react'

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
        const res = await fetch('/api/admin/data/tables')
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
        const res = await fetch(`/api/admin/data/${table}?` + params.toString())
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
      const res = await fetch(`/api/admin/data/${table}`, {
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
      const res = await fetch(`/api/admin/data/${table}?id=${id}`, { method: 'DELETE' })
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
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-amber-900">Admin Data Viewer</h1>
        <p className="text-amber-700 mt-1">Browse and edit data across tables</p>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap items-center gap-3">
        <select
          value={table}
          onChange={(e) => { setTable(e.target.value); setPagination((p) => ({ ...p, page: 1 })) }}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {tables.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter locally (JSON search)"
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg"
        />
        <select
          value={pagination.limit}
          onChange={(e) => setPagination((p) => ({ ...p, page: 1, limit: parseInt(e.target.value, 10) }))}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-amber-50 to-yellow-50">
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="px-3 py-2 text-left font-semibold text-amber-900">{c}</th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold text-amber-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((row, index) => (
                  <tr key={row.id ? String(row.id) : `row-${index}`} className="hover:bg-amber-50">
                    {columns.map((c) => (
                      <td key={c} className="px-3 py-2 align-top">
                        {editing && editing.id === row.id ? (
                          <input
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            value={String(editing[c] ?? '')}
                            onChange={(e) => setEditing((prev) => prev ? { ...prev, [c]: e.target.value } : prev)}
                          />
                        ) : (
                          <span className="text-gray-800 break-all">{String(row[c] ?? '')}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {editing && editing.id === row.id ? (
                        <>
                          <button onClick={saveEdit} className="mr-2 px-3 py-1 rounded bg-amber-600 text-white">Save</button>
                          <button onClick={cancelEdit} className="px-3 py-1 rounded bg-gray-200 text-gray-800">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(row)} className="mr-2 px-3 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">Edit</button>
                          {row.id && (
                            <button onClick={() => deleteRow(String(row.id))} className="px-3 py-1 rounded bg-red-100 text-red-700 border border-red-300">Delete</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
                <button
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                  onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
                >
                  Previous
                </button>
                <span className="text-gray-700">Page {pagination.page} of {pagination.pages}</span>
                <button
                  disabled={pagination.page >= pagination.pages}
                  className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
                  onClick={() => setPagination((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
