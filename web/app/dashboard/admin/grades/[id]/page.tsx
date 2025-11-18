'use client'

/**
 * Admin Grade Details Page
 * View and edit individual grade with full context
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GradeDetails {
  id: string
  assignment_id: string
  student_id: string
  points_earned: number | null
  letter_grade: string | null
  feedback: string | null
  submitted_at: string | null
  graded_at: string | null
  created_at: string
  updated_at: string
  percentage: number | null
  calculated_letter_grade: string | null
  assignment: {
    id: string
    title: string
    description: string
    max_points: number
    type: string
    due_date: string
    published: boolean
    class: {
      id: string
      name: string
      code: string
      grade_level: number
      teacher: {
        id: string
        first_name: string
        last_name: string
        email: string
      }
      academic_year: {
        id: string
        year_name: string
        start_date: string
        end_date: string
      }
    }
    category: {
      id: string
      name: string
      weight: number
    } | null
  }
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    student_number: string
    date_of_birth: string
    phone: string
  }
}

export default function GradeDetailsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [grade, setGrade] = useState<GradeDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editPoints, setEditPoints] = useState('')
  const [editFeedback, setEditFeedback] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(p => setResolvedParams(p))
  }, [params])

  useEffect(() => {
    if (resolvedParams) {
      fetchGrade()
    }
  }, [resolvedParams])

  const fetchGrade = async () => {
    if (!resolvedParams) return

    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch(`/api/admin/grades/${resolvedParams.id}`)
      const response = await res.json()
      setGrade(response.grade)
      setEditPoints(response.grade.points_earned?.toString() || '')
      setEditFeedback(response.grade.feedback || '')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch grade')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!grade) return

    const pointsValue = editPoints.trim() === '' ? null : parseFloat(editPoints)

    if (pointsValue !== null) {
      if (isNaN(pointsValue) || pointsValue < 0 || pointsValue > grade.assignment.max_points) {
        alert(`Points must be between 0 and ${grade.assignment.max_points}`)
        return
      }
    }

    setSaving(true)
    try {
      await apiFetch(`/api/admin/grades/${grade.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          points_earned: pointsValue,
          feedback: editFeedback || null
        })
      })

      setIsEditing(false)
      fetchGrade() // Reload to show updated data
      alert('Grade updated successfully')
    } catch (err: any) {
      alert(err.message || 'Failed to update grade')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!grade) return

    if (!confirm('Are you sure you want to delete this grade? This cannot be undone.')) {
      return
    }

    try {
      await apiFetch(`/api/admin/grades/${grade.id}`, {
        method: 'DELETE'
      })
      router.push('/dashboard/admin/grades')
    } catch (err: any) {
      alert(err.message || 'Failed to delete grade')
    }
  }

  const getGradeColor = () => {
    if (!grade || grade.percentage === null) return 'text-gray-400'

    const percentage = grade.percentage
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading grade details...</p>
        </div>
      </div>
    )
  }

  if (error || !grade) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Grade not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/dashboard/admin/grades" className="hover:text-blue-600">
              Grades
            </Link>
            <span>›</span>
            <span>Grade Details</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Grade Details</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '✓ Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditPoints(grade.points_earned?.toString() || '')
                  setEditFeedback(grade.feedback || '')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                ✕ Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                ✏️ Edit Grade
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                🗑️ Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grade Score Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Grade Score</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Points Earned</div>
            {isEditing ? (
              <input
                type="number"
                min="0"
                max={grade.assignment.max_points}
                step="0.5"
                value={editPoints}
                onChange={(e) => setEditPoints(e.target.value)}
                className="w-full text-2xl font-bold text-center border rounded px-2 py-1"
                placeholder="Not graded"
              />
            ) : (
              <div className={`text-3xl font-bold ${getGradeColor()}`}>
                {grade.points_earned !== null ? grade.points_earned : 'Not graded'}
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Out of</div>
            <div className="text-3xl font-bold text-gray-900">{grade.assignment.max_points}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Percentage</div>
            <div className={`text-3xl font-bold ${getGradeColor()}`}>
              {grade.percentage !== null ? `${grade.percentage.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Letter Grade</div>
            <div className={`text-3xl font-bold ${getGradeColor()}`}>
              {grade.calculated_letter_grade || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Name</div>
            <div className="text-lg font-medium text-gray-900">
              {grade.student.first_name} {grade.student.last_name}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Student Number</div>
            <div className="text-lg font-medium text-gray-900">
              {grade.student.student_number || 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Email</div>
            <div className="text-lg font-medium text-gray-900">{grade.student.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Phone</div>
            <div className="text-lg font-medium text-gray-900">{grade.student.phone || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Assignment Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Assignment Information</h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-600">Title</div>
            <Link
              href={`/dashboard/admin/assignments/${grade.assignment.id}`}
              className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {grade.assignment.title}
            </Link>
          </div>
          <div>
            <div className="text-sm text-gray-600">Description</div>
            <div className="text-gray-900 whitespace-pre-wrap">
              {grade.assignment.description || 'No description'}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Type</div>
              <div className="text-lg font-medium text-gray-900 capitalize">
                {grade.assignment.type}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Due Date</div>
              <div className="text-lg font-medium text-gray-900">
                {new Date(grade.assignment.due_date).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Category</div>
              <div className="text-lg font-medium text-gray-900">
                {grade.assignment.category?.name || 'None'} 
                {grade.assignment.category && ` (${grade.assignment.category.weight}%)`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Class</div>
            <Link
              href={`/dashboard/admin/classes/${grade.assignment.class.id}`}
              className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {grade.assignment.class.name} ({grade.assignment.class.code})
            </Link>
          </div>
          <div>
            <div className="text-sm text-gray-600">Grade Level</div>
            <div className="text-lg font-medium text-gray-900">
              {grade.assignment.class.grade_level}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Teacher</div>
            <div className="text-lg font-medium text-gray-900">
              {grade.assignment.class.teacher.first_name} {grade.assignment.class.teacher.last_name}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Academic Year</div>
            <div className="text-lg font-medium text-gray-900">
              {grade.assignment.class.academic_year.year_name}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Feedback</h2>
        {isEditing ? (
          <textarea
            value={editFeedback}
            onChange={(e) => setEditFeedback(e.target.value)}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter feedback for the student..."
          />
        ) : (
          <div className="text-gray-900 whitespace-pre-wrap">
            {grade.feedback || 'No feedback provided'}
          </div>
        )}
      </div>

      {/* Grade History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Grade History</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Created:</span>
            <span className="text-gray-900">{new Date(grade.created_at).toLocaleString()}</span>
          </div>
          {grade.updated_at && grade.updated_at !== grade.created_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900">{new Date(grade.updated_at).toLocaleString()}</span>
            </div>
          )}
          {grade.submitted_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Submitted:</span>
              <span className="text-gray-900">{new Date(grade.submitted_at).toLocaleString()}</span>
            </div>
          )}
          {grade.graded_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Graded:</span>
              <span className="text-gray-900">{new Date(grade.graded_at).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ℹ️ Note: Full audit trail functionality will be available when grade_audit_log table is implemented.
          </p>
        </div>
      </div>
    </div>
  )
}
