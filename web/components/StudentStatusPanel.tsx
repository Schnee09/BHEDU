'use client'

import { useMemo, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'

type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended'

const statusConfig: Record<StudentStatus, { label: string; color: string; description: string }> = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    description: 'Student can attend classes and receive grades.'
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
    description: 'Student is archived/disabled and should not appear in active lists.'
  },
  graduated: {
    label: 'Graduated',
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    description: 'Student has completed the program. Records remain read-only.'
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    description: 'Student is temporarily suspended. Attendance/grades may be restricted by policy.'
  },
}

export default function StudentStatusPanel({
  studentId,
  currentStatus,
  isAdmin
}: {
  studentId: string
  currentStatus: StudentStatus
  isAdmin: boolean
}) {
  const [status, setStatus] = useState<StudentStatus>(currentStatus)
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState('')

  const changed = useMemo(() => status !== currentStatus, [status, currentStatus])

  const handleSave = async () => {
    if (!isAdmin) return

    setSaving(true)
    const toastId = showToast.loading('Updating status...')

    try {
      const res = await apiFetch(`/api/admin/students/${studentId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reason.trim() || undefined })
      })

      const json = await res.json()
      showToast.dismiss(toastId)

      if (!res.ok) {
        showToast.error(json?.error || 'Failed to update status')
        return
      }

      showToast.success('Status updated')
      setReason('')
    } catch (err) {
      showToast.dismiss(toastId)
      console.error(err)
      showToast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const cfg = statusConfig[status]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Student Status</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Use this to archive, suspend, or mark a student as graduated.</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StudentStatus)}
            disabled={!isAdmin || saving}
            className="w-full md:w-80 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="suspended">Suspended</option>
          </select>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{cfg.description}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!isAdmin || saving}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800"
            placeholder="e.g., Suspended due to misconduct..."
          />
        </div>

        {!isAdmin && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 text-sm text-yellow-900 dark:text-yellow-300">
            Only admins can change student status.
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !changed}
              className="px-4 py-2 bg-stone-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-stone-800 dark:hover:bg-gray-200 text-sm font-medium disabled:bg-stone-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Status'}
            </button>
            {changed && !saving && (
              <span className="text-xs text-gray-600 dark:text-gray-400">Change will take effect immediately.</span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Workflow notes</h3>
        <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li><strong>Inactive</strong> is used as "archived".</li>
          <li><strong>Suspended</strong> is intended for temporary blocks (policy-driven).</li>
          <li><strong>Graduated</strong> keeps historical records but should typically stop new enrollments.</li>
        </ul>
      </div>
    </div>
  )
}
