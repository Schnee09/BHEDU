'use client'

/**
 * Admin Grades Management Page
 * View and manage grades across all classes and assignments
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'

interface Grade {
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
  assignment: {
    id: string
    title: string
    max_points: number
    type: string
    due_date: string
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
    }
  }
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    student_number: string
  }
}

interface Class {
  id: string
  name: string
  code: string
}

interface Assignment {
  id: string
  title: string
}

export default function GradesManagementPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    class_id: '',
    assignment_id: '',
    student_search: '',
    status: '', // graded, pending
    min_grade: '',
    max_grade: ''
  })

  // Sorting
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalGrades, setTotalGrades] = useState(0)
  const limit = 50

  // Bulk operations
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(new Set())

  // Fetch classes and assignments for filters
  useEffect(() => {
    fetchClasses()
    fetchAssignments()
  }, [])

  // Fetch grades
  useEffect(() => {
    fetchGrades()
  }, [page, sortBy, sortOrder, filters])

  const fetchClasses = async () => {
    try {
      const res = await apiFetch('/api/admin/classes?limit=1000')
      const response = await res.json()
      setClasses(response.classes || [])
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const fetchAssignments = async () => {
    try {
      const res = await apiFetch('/api/admin/assignments?limit=1000')
      const response = await res.json()
      setAssignments(response.assignments || [])
    } catch (err) {
      console.error('Error fetching assignments:', err)
    }
  }

  const fetchGrades = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      })

      if (filters.class_id) params.append('class_id', filters.class_id)
      if (filters.assignment_id) params.append('assignment_id', filters.assignment_id)
      if (filters.status) params.append('status', filters.status)
      if (filters.min_grade) params.append('min_grade', filters.min_grade)
      if (filters.max_grade) params.append('max_grade', filters.max_grade)

      const res = await apiFetch(`/api/admin/grades?${params}`)
      const response = await res.json()
      setGrades(response.grades || [])
      setTotalPages(response.pagination?.total_pages || 1)
      setTotalGrades(response.pagination?.total || 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch grades'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filtering
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleSelectGrade = (id: string) => {
    const newSelected = new Set(selectedGrades)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedGrades(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedGrades.size === grades.length) {
      setSelectedGrades(new Set())
    } else {
      setSelectedGrades(new Set(grades.map(g => g.id)))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedGrades.size === 0) {
      alert('Please select grades to delete')
      return
    }

    if (!confirm(`Delete ${selectedGrades.size} grades? This cannot be undone.`)) {
      return
    }

    try {
      const deletes = Array.from(selectedGrades).map(id =>
        apiFetch(`/api/admin/grades/${id}`, { method: 'DELETE' })
      )

      await Promise.all(deletes)
      setSelectedGrades(new Set())
      fetchGrades()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete grades'
      alert(errorMessage)
    }
  }

  const exportToCSV = () => {
    const headers = ['Student', 'Student Number', 'Assignment', 'Class', 'Points Earned', 'Max Points', 'Percentage', 'Letter Grade', 'Status', 'Graded At']
    const rows = filteredGrades.map(g => {
      const percentage = g.points_earned !== null && g.assignment.max_points 
        ? ((g.points_earned / g.assignment.max_points) * 100).toFixed(2)
        : 'N/A'
      
      return [
        `${g.student.first_name} ${g.student.last_name}`,
        g.student.student_number || '',
        g.assignment.title,
        `${g.assignment.class.name} (${g.assignment.class.code})`,
        g.points_earned?.toString() || 'Not graded',
        g.assignment.max_points.toString(),
        percentage,
        g.letter_grade || '-',
        g.points_earned !== null ? 'Graded' : 'Pending',
        g.graded_at ? new Date(g.graded_at).toLocaleDateString() : '-'
      ]
    })

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `grades_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getGradeColor = (grade: Grade) => {
    if (grade.points_earned === null) return 'text-gray-400'
    
    const percentage = (grade.points_earned / grade.assignment.max_points) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    if (percentage >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  const getPercentage = (grade: Grade) => {
    if (grade.points_earned === null) return 'N/A'
    return ((grade.points_earned / grade.assignment.max_points) * 100).toFixed(1) + '%'
  }

  // Filter grades by student search (client-side)
  const filteredGrades = grades.filter(grade => {
    if (filters.student_search) {
      const search = filters.student_search.toLowerCase()
      const student = grade.student
      return (
        student.first_name.toLowerCase().includes(search) ||
        student.last_name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        (student.student_number && student.student_number.toLowerCase().includes(search))
      )
    }
    return true
  })

  // Calculate statistics
  const stats = {
    totalGraded: filteredGrades.filter(g => g.points_earned !== null).length,
    totalPending: filteredGrades.filter(g => g.points_earned === null).length,
    averageScore: filteredGrades.length > 0
      ? filteredGrades
          .filter(g => g.points_earned !== null)
          .reduce((sum, g) => {
            const percentage = (g.points_earned! / g.assignment.max_points) * 100
            return sum + percentage
          }, 0) / filteredGrades.filter(g => g.points_earned !== null).length
      : 0
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grades Management</h1>
          <p className="text-gray-600 mt-1">View and manage grades across all classes</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Grades</div>
          <div className="text-2xl font-bold text-gray-900">{totalGrades}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Graded</div>
          <div className="text-2xl font-bold text-green-600">{stats.totalGraded}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.totalPending}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Average Score</div>
          <div className="text-2xl font-bold text-blue-600">
            {stats.averageScore > 0 ? stats.averageScore.toFixed(1) + '%' : 'N/A'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filters.class_id}
              onChange={(e) => handleFilterChange('class_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignment</label>
            <select
              value={filters.assignment_id}
              onChange={(e) => handleFilterChange('assignment_id', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Assignments</option>
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="graded">Graded</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Grade</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={filters.min_grade}
              onChange={(e) => handleFilterChange('min_grade', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Grade</label>
            <input
              type="number"
              min="0"
              placeholder="100"
              value={filters.max_grade}
              onChange={(e) => handleFilterChange('max_grade', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Search</label>
            <input
              type="text"
              placeholder="Name, email, number..."
              value={filters.student_search}
              onChange={(e) => handleFilterChange('student_search', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setFilters({
                class_id: '',
                assignment_id: '',
                student_search: '',
                status: '',
                min_grade: '',
                max_grade: ''
              })
              setPage(1)
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedGrades.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg shadow flex items-center justify-between">
          <div className="text-sm font-medium text-blue-900">
            {selectedGrades.size} grade(s) selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              🗑�E�EDelete Selected
            </button>
          </div>
        </div>
      )}

      {/* Loading / Error / Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading grades...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : filteredGrades.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No grades found</p>
        </div>
      ) : (
        <>
          {/* Grades Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedGrades.size === filteredGrades.length && filteredGrades.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th
                      onClick={() => handleSort('points_earned')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Score {sortBy === 'points_earned' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGrades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedGrades.has(grade.id)}
                          onChange={() => handleSelectGrade(grade.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {grade.student.first_name} {grade.student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{grade.student.student_number}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/dashboard/admin/assignments/${grade.assignment.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {grade.assignment.title}
                        </Link>
                        <div className="text-xs text-gray-500">{grade.assignment.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/dashboard/admin/classes/${grade.assignment.class.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {grade.assignment.class.name}
                        </Link>
                        <div className="text-xs text-gray-500">{grade.assignment.class.code}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGradeColor(grade)}`}>
                        {grade.points_earned !== null 
                          ? `${grade.points_earned} / ${grade.assignment.max_points}`
                          : 'Not graded'
                        }
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getGradeColor(grade)}`}>
                        {getPercentage(grade)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          grade.points_earned !== null 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {grade.points_earned !== null ? 'Graded' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/dashboard/admin/grades/${grade.id}`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm('Delete this grade?')) {
                              apiFetch(`/api/admin/grades/${grade.id}`, {
                                method: 'DELETE'
                              }).then(fetchGrades)
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 rounded-lg shadow">
              <div className="text-sm text-gray-700">
                Showing page {page} of {totalPages} ({totalGrades} total grades)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
