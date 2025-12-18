'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'

type ImportLog = {
  id: string
  import_type: string
  status: string
  total_rows: number | null
  processed_rows: number | null
  success_count: number | null
  error_count: number | null
  error_summary: string | null
  created_at: string
  importer?: { id: string; full_name: string | null; email: string | null } | null
}

type ImportErrorRow = {
  id: string
  import_log_id: string
  row_number: number | null
  field_name: string | null
  error_type: string | null
  error_message: string | null
  severity: string | null
  created_at: string
}

export default function ImportHistoryPanel() {
  const [logs, setLogs] = useState<ImportLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [errors, setErrors] = useState<ImportErrorRow[]>([])
  const [errorsLoading, setErrorsLoading] = useState(false)

  const selectedLog = useMemo(() => logs.find((l) => l.id === selectedLogId) || null, [logs, selectedLogId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await apiFetch('/api/admin/students/import/history?limit=10&offset=0')
        const json = await res.json()
        if (!res.ok) {
          showToast.error(json?.error || 'Failed to load import history')
          return
        }
        setLogs(json.logs || [])
      } catch (err) {
        console.error(err)
        showToast.error('Failed to load import history')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const loadErrors = async (importLogId: string) => {
    setErrorsLoading(true)
    try {
      const res = await apiFetch(`/api/admin/students/import/errors?import_log_id=${encodeURIComponent(importLogId)}`)
      const json = await res.json()
      if (!res.ok) {
        showToast.error(json?.error || 'Failed to load import errors')
        return
      }
      setErrors(json.data || [])
    } catch (err) {
      console.error(err)
      showToast.error('Failed to load import errors')
    } finally {
      setErrorsLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading import history...</div>
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Import History</h2>
        <p className="text-sm text-gray-600 mt-1">Validation results and error reporting from bulk student imports.</p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">No imports found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700">Recent imports</div>
            <ul className="divide-y">
              {logs.map((log) => {
                const isSelected = log.id === selectedLogId
                const badgeColor =
                  log.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : log.status === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'

                return (
                  <li key={log.id} className={`p-4 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    <button
                      type="button"
                      onClick={async () => {
                        setSelectedLogId(log.id)
                        await loadErrors(log.id)
                      }}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-gray-900">{new Date(log.created_at).toLocaleString()}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            By {log.importer?.full_name || log.importer?.email || 'Unknown'} · Total {log.total_rows ?? 0}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${badgeColor}`}>{log.status}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-700 flex gap-4 flex-wrap">
                        <span>✅ {log.success_count ?? 0} success</span>
                        <span>❌ {log.error_count ?? 0} errors</span>
                        <span>📦 {log.processed_rows ?? 0}/{log.total_rows ?? 0} processed</span>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700">Errors</div>

            {!selectedLog ? (
              <div className="p-6 text-sm text-gray-600">Select an import to view row-level errors.</div>
            ) : errorsLoading ? (
              <div className="p-6 text-sm text-gray-600">Loading errors...</div>
            ) : errors.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No errors for this import.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Row</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Field</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Message</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {errors.slice(0, 50).map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{e.row_number ?? '—'}</td>
                        <td className="px-4 py-2">{e.field_name ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-700">{e.error_message ?? '—'}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              e.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {e.severity || 'error'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {errors.length > 50 && (
                  <div className="p-3 text-xs text-gray-600 border-t">Showing first 50 errors.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
