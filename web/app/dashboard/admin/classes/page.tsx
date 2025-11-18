"use client"

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'

// Types
type Class = {
  id: string
  name: string
  code: string | null
  description: string | null
  grade_level: string
  status: string
  academic_year_id: string
  teacher_id: string
  room_number: string | null
  schedule: any
  max_students: number | null
  created_at: string
  updated_at: string
  teacher: {
    id: string
    full_name: string
    email: string
  } | null
  academic_year: {
    id: string
    name: string
  } | null
  enrollment_count: number
}

type Teacher = {
  id: string
  full_name: string
  email: string
}

type AcademicYear = {
  id: string
  name: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  total_pages: number
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  })

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    grade_level: '',
    teacher_id: '',
    academic_year_id: '',
    status: ''
  })

  // Sort
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)

  // Selected classes for bulk operations
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set())

  // Fetch classes
  const fetchClasses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      })

      // Add filters
      if (filters.search) params.append('search', filters.search)
      if (filters.grade_level) params.append('grade_level', filters.grade_level)
      if (filters.teacher_id) params.append('teacher_id', filters.teacher_id)
      if (filters.academic_year_id) params.append('academic_year_id', filters.academic_year_id)
      if (filters.status) params.append('status', filters.status)

      const res = await apiFetch(`/api/admin/classes?${params}`)
      const response = await res.json()
      if (response.success) {
        setClasses(response.classes)
        setPagination(response.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      const res = await apiFetch('/api/admin/users?role=teacher&limit=1000')
      const response = await res.json()
      if (response.success) {
        setTeachers(response.users)
      }
    } catch (error) {
      console.error('Failed to fetch teachers:', error)
    }
  }

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      const res = await apiFetch('/api/admin/academic-years')
      const response = await res.json()
      if (response.success) {
        setAcademicYears(response.academic_years)
      }
    } catch (error) {
      console.error('Failed to fetch academic years:', error)
      // Fallback: use seed data IDs
      setAcademicYears([
        { id: 'a2000000-0000-0000-0000-000000000002', name: '2024-2025' },
        { id: 'a3000000-0000-0000-0000-000000000003', name: '2025-2026' }
      ])
    }
  }

  // Initial load
  useEffect(() => {
    fetchTeachers()
    fetchAcademicYears()
  }, [])

  // Fetch classes when filters/pagination/sorting changes
  useEffect(() => {
    fetchClasses()
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filters])

  // Handle filter change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to page 1
  }

  // Handle sort
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Toggle class selection
  const toggleClassSelection = (classId: string) => {
    const newSelected = new Set(selectedClasses)
    if (newSelected.has(classId)) {
      newSelected.delete(classId)
    } else {
      newSelected.add(classId)
    }
    setSelectedClasses(newSelected)
  }

  // Select all/none
  const toggleSelectAll = () => {
    if (selectedClasses.size === classes.length) {
      setSelectedClasses(new Set())
    } else {
      setSelectedClasses(new Set(classes.map(c => c.id)))
    }
  }

  // Handle delete
  const handleDelete = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class?')) return

    try {
      const res = await apiFetch(`/api/admin/classes/${classId}`, {
        method: 'DELETE'
      })
      const response = await res.json()

      if (response.success) {
        alert('Class deleted successfully')
        fetchClasses()
      } else {
        alert(response.error || 'Failed to delete class')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete class')
    }
  }

  // Handle bulk archive
  const handleBulkArchive = async () => {
    if (selectedClasses.size === 0) {
      alert('No classes selected')
      return
    }

    if (!confirm(`Archive ${selectedClasses.size} class(es)?`)) return

    try {
      const promises = Array.from(selectedClasses).map(id =>
        apiFetch(`/api/admin/classes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'archived' })
        })
      )

      await Promise.all(promises)
      alert('Classes archived successfully')
      setSelectedClasses(new Set())
      fetchClasses()
    } catch (error) {
      console.error('Bulk archive error:', error)
      alert('Failed to archive some classes')
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Code', 'Grade', 'Teacher', 'Status', 'Students', 'Year', 'Room']
    const rows = classes.map(c => [
      c.name,
      c.code || '',
      c.grade_level,
      c.teacher?.full_name || '',
      c.status,
      c.enrollment_count.toString(),
      c.academic_year?.name || '',
      c.room_number || ''
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `classes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Classes Management</h1>
        <p className="text-gray-600 mt-1">Manage all classes, enrollments, and assignments</p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-4 space-y-4">
        {/* Search & Primary Actions */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search classes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Class
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            📊 Export CSV
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={filters.grade_level}
            onChange={(e) => handleFilterChange('grade_level', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Grades</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
            <option value="Grade 4">Grade 4</option>
            <option value="Grade 5">Grade 5</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 7">Grade 7</option>
            <option value="Grade 8">Grade 8</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Grade 10">Grade 10</option>
            <option value="Grade 11">Grade 11</option>
            <option value="Grade 12">Grade 12</option>
          </select>

          <select
            value={filters.teacher_id}
            onChange={(e) => handleFilterChange('teacher_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Teachers</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>

          <select
            value={filters.academic_year_id}
            onChange={(e) => handleFilterChange('academic_year_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Years</option>
            {academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedClasses.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-sm font-medium text-blue-900">
              {selectedClasses.size} selected
            </span>
            <button
              onClick={handleBulkArchive}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
            >
              📦 Archive Selected
            </button>
            <button
              onClick={() => setSelectedClasses(new Set())}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No classes found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-blue-600 hover:underline"
            >
              Create your first class
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedClasses.size === classes.length && classes.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Class Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('code')}
                  >
                    Code {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('grade_level')}
                  >
                    Grade {sortBy === 'grade_level' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedClasses.has(cls.id)}
                        onChange={() => toggleClassSelection(cls.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <a
                          href={`/dashboard/admin/classes/${cls.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {cls.name}
                        </a>
                        {cls.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {cls.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {cls.code || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        {cls.grade_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {cls.teacher?.full_name || <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {cls.enrollment_count}
                        {cls.max_students && (
                          <span className="text-gray-400"> / {cls.max_students}</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        cls.status === 'active' ? 'bg-green-100 text-green-800' :
                        cls.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {cls.room_number || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                      <button
                        onClick={() => {
                          setSelectedClass(cls)
                          setShowEditModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cls.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} classes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.total_pages}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <ClassFormModal
          mode="create"
          teachers={teachers}
          academicYears={academicYears}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchClasses()
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedClass && (
        <ClassFormModal
          mode="edit"
          classData={selectedClass}
          teachers={teachers}
          academicYears={academicYears}
          onClose={() => {
            setShowEditModal(false)
            setSelectedClass(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedClass(null)
            fetchClasses()
          }}
        />
      )}
    </div>
  )
}

// Class Form Modal Component
function ClassFormModal({
  mode,
  classData,
  teachers,
  academicYears,
  onClose,
  onSuccess
}: {
  mode: 'create' | 'edit'
  classData?: Class
  teachers: Teacher[]
  academicYears: AcademicYear[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    code: classData?.code || '',
    description: classData?.description || '',
    grade_level: classData?.grade_level || 'Grade 1',
    status: classData?.status || 'active',
    teacher_id: classData?.teacher_id || '',
    academic_year_id: classData?.academic_year_id || '',
    room_number: classData?.room_number || '',
    max_students: classData?.max_students?.toString() || ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const body = {
        ...formData,
        max_students: formData.max_students ? parseInt(formData.max_students) : null
      }

      const url = mode === 'create'
        ? '/api/admin/classes'
        : `/api/admin/classes/${classData?.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response: any = await apiFetch(url, {
        method,
        body: JSON.stringify(body)
      })

      if (response.success) {
        onSuccess()
      } else {
        setError(response.error || 'Failed to save class')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Class' : 'Edit Class'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Math 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., MTH-101"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Class description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade Level *
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Kindergarten">Kindergarten</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teacher *
              </label>
              <select
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a teacher...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <select
                value={formData.academic_year_id}
                onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a year...</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Number
              </label>
              <input
                type="text"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <input
                type="number"
                value={formData.max_students}
                onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 30"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create Class' : 'Update Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
