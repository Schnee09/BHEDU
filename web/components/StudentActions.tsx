'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { showToast } from '@/components/ToastProvider'

interface StudentActionsProps {
  studentId: string
  studentName: string
  isAdmin: boolean
}

export default function StudentActions({ studentId, studentName, isAdmin }: StudentActionsProps) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleArchive = async () => {
    setDeleting(true)
    const loadingToast = showToast.loading('Archiving student...')

    try {
      const response = await apiFetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      showToast.dismiss(loadingToast)

      if (response.ok) {
        showToast.success('Student archived successfully!')
        setShowDeleteModal(false)
        setTimeout(() => {
          router.push('/dashboard/students')
        }, 1500)
      } else {
        showToast.error(result.error || 'Failed to archive student')
      }
    } catch (error) {
      showToast.dismiss(loadingToast)
      console.error('Failed to archive student:', error)
      showToast.error('Failed to archive student. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/dashboard/students/${studentId}/edit`}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
      >
        ✏️ Edit
      </Link>

      {isAdmin && (
        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm"
        >
          🗑️ Archive
        </button>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Archive Student?</h2>
            <p className="text-gray-700 mb-2">
              Are you sure you want to archive <strong>{studentName}</strong>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This will set their status to &quot;inactive&quot; and hide them from active student lists. 
              This action can be reversed by editing the student later.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> All student data (grades, attendance, enrollments) will be preserved.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-red-400"
              >
                {deleting ? 'Archiving...' : 'Yes, Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
