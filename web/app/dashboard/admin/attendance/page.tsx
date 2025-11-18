'use client'

/**
 * Admin Attendance Management Page
 * View and manage attendance records across all classes
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'

interface AttendanceRecord {
  id: string
  enrollment_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  notes: string | null
  created_at: string
  enrollment: {
    id: string
    student: {
      id: string
      first_name: string
      last_name: string
      email: string
      student_number: string
    }
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
}

interface Class {
  id: string
  name: string
  code: string
}

export default function AttendanceManagementPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    class_id: '',
    student_search: '',
    status: '',
    start_date: '',
    end_date: '',
    date: ''
  })

  // Sorting
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const limit = 50

  // Bulk operations
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [showBulkMarkModal, setShowBulkMarkModal] = useState(false)
  
  // Bulk mark modal state
  const [bulkMarkClass, setBulkMarkClass] = useState('')
  const [bulkMarkDate, setBulkMarkDate] = useState(new Date().toISOString().split('T')[0])
  const [bulkMarkStatus, setBulkMarkStatus] = useState<'present' | 'absent' | 'late' | 'excused'>('present')
  const [bulkMarkStudents, setBulkMarkStudents] = useState<any[]>([])
  const [bulkMarkLoading, setBulkMarkLoading] = useState(false)
  
  // Inline edit state
  const [editingRecord, setEditingRecord] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Fetch classes for filter
  useEffect(() => {
    fetchClasses()
  }, [])

  // Fetch attendance records
  useEffect(() => {
    fetchRecords()
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

  const fetchRecords = async () => {
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
      if (filters.status) params.append('status', filters.status)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.date) params.append('date', filters.date)

      const res = await apiFetch(`/api/admin/attendance?${params}`)
      const response = await res.json()
      setRecords(response.records || [])
      setTotalPages(response.pagination?.total_pages || 1)
      setTotalRecords(response.pagination?.total || 0)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch attendance records')
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

  const handleSelectRecord = (id: string) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRecords(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set())
    } else {
      setSelectedRecords(new Set(records.map(r => r.id)))
    }
  }

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedRecords.size === 0) {
      alert('Please select records to update')
      return
    }

    if (!confirm(`Update ${selectedRecords.size} records to ${status}?`)) {
      return
    }

    try {
      const updates = Array.from(selectedRecords).map(id =>
        apiFetch(`/api/admin/attendance/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        })
      )

      await Promise.all(updates)
      setSelectedRecords(new Set())
      fetchRecords()
    } catch (err: any) {
      alert(err.message || 'Failed to update attendance records')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedRecords.size === 0) {
      alert('Please select records to delete')
      return
    }

    if (!confirm(`Delete ${selectedRecords.size} attendance records? This cannot be undone.`)) {
      return
    }

    try {
      const deletes = Array.from(selectedRecords).map(id =>
        apiFetch(`/api/admin/attendance/${id}`, { method: 'DELETE' })
      )

      await Promise.all(deletes)
      setSelectedRecords(new Set())
      fetchRecords()
    } catch (err: any) {
      alert(err.message || 'Failed to delete attendance records')
    }
  }
  
  // Bulk mark modal handlers
  const handleOpenBulkMarkModal = () => {
    setBulkMarkClass('')
    setBulkMarkDate(new Date().toISOString().split('T')[0])
    setBulkMarkStatus('present')
    setBulkMarkStudents([])
    setShowBulkMarkModal(true)
  }
  
  const handleBulkMarkClassChange = async (classId: string) => {
    setBulkMarkClass(classId)
    if (!classId) {
      setBulkMarkStudents([])
      return
    }
    
    // Fetch students enrolled in this class
    try {
      const res = await apiFetch(`/api/admin/classes/${classId}`)
      const response = await res.json()
      const enrollments = response.class?.enrollments || []
      setBulkMarkStudents(enrollments.map((e: any) => ({
        enrollment_id: e.id,
        student: e.student,
        status: 'present'
      })))
    } catch (err) {
      console.error('Error fetching class enrollments:', err)
      alert('Failed to load students')
    }
  }
  
  const handleBulkMarkStatusToggle = (enrollmentId: string, status: string) => {
    setBulkMarkStudents(prev => 
      prev.map(s => 
        s.enrollment_id === enrollmentId ? { ...s, status } : s
      )
    )
  }
  
  const handleBulkMarkSubmit = async () => {
    if (!bulkMarkClass || !bulkMarkDate || bulkMarkStudents.length === 0) {
      alert('Please select a class and ensure students are loaded')
      return
    }
    
    setBulkMarkLoading(true)
    try {
      const records = bulkMarkStudents.map(s => ({
        enrollment_id: s.enrollment_id,
        date: bulkMarkDate,
        status: s.status,
        notes: null
      }))
      
      await apiFetch('/api/admin/attendance', {
        method: 'POST',
        body: JSON.stringify({ records })
      })
      
      setShowBulkMarkModal(false)
      fetchRecords()
      alert(`Successfully marked attendance for ${records.length} students`)
    } catch (err: any) {
      alert(err.message || 'Failed to mark attendance')
    } finally {
      setBulkMarkLoading(false)
    }
  }
  
  // Inline edit handlers
  const handleStartEdit = (record: AttendanceRecord) => {
    setEditingRecord(record.id)
    setEditStatus(record.status)
    setEditNotes(record.notes || '')
  }
  
  const handleCancelEdit = () => {
    setEditingRecord(null)
    setEditStatus('')
    setEditNotes('')
  }
  
  const handleSaveEdit = async (recordId: string) => {
    try {
      await apiFetch(`/api/admin/attendance/${recordId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: editStatus,
          notes: editNotes || null
        })
      })
      setEditingRecord(null)
      fetchRecords()
    } catch (err: any) {
      alert(err.message || 'Failed to update record')
    }
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Student', 'Student Number', 'Class', 'Status', 'Notes']
    const rows = records.map(r => [
      r.date,
      `${r.enrollment.student.first_name} ${r.enrollment.student.last_name}`,
      r.enrollment.student.student_number || '',
      `${r.enrollment.class.name} (${r.enrollment.class.code})`,
      r.status,
      r.notes || ''
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'late': return 'bg-yellow-100 text-yellow-800'
      case 'excused': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter records by student search (client-side)
  const filteredRecords = records.filter(record => {
    if (filters.student_search) {
      const search = filters.student_search.toLowerCase()
      const student = record.enrollment.student
      return (
        student.first_name.toLowerCase().includes(search) ||
        student.last_name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        (student.student_number && student.student_number.toLowerCase().includes(search))
      )
    }
    return true
  })

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600 mt-1">View and manage attendance across all classes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => setShowBulkMarkModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            ➕ Bulk Mark Attendance
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Records</div>
          <div className="text-2xl font-bold text-gray-900">{totalRecords}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Present Today</div>
          <div className="text-2xl font-bold text-green-600">
            {records.filter(r => r.status === 'present' && r.date === new Date().toISOString().split('T')[0]).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Absent Today</div>
          <div className="text-2xl font-bold text-red-600">
            {records.filter(r => r.status === 'absent' && r.date === new Date().toISOString().split('T')[0]).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Late Today</div>
          <div className="text-2xl font-bold text-yellow-600">
            {records.filter(r => r.status === 'late' && r.date === new Date().toISOString().split('T')[0]).length}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specific Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              disabled={!!filters.date}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              disabled={!!filters.date}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
                student_search: '',
                status: '',
                start_date: '',
                end_date: '',
                date: ''
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
      {selectedRecords.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg shadow flex items-center justify-between">
          <div className="text-sm font-medium text-blue-900">
            {selectedRecords.size} record(s) selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkUpdateStatus('present')}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Mark Present
            </button>
            <button
              onClick={() => handleBulkUpdateStatus('absent')}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Mark Absent
            </button>
            <button
              onClick={() => handleBulkUpdateStatus('late')}
              className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
            >
              Mark Late
            </button>
            <button
              onClick={() => handleBulkUpdateStatus('excused')}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Mark Excused
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      {/* Loading / Error / Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading attendance records...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">No attendance records found</p>
        </div>
      ) : (
        <>
          {/* Attendance Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedRecords.size === filteredRecords.length && filteredRecords.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRecords.has(record.id)}
                          onChange={() => handleSelectRecord(record.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.enrollment.student.first_name} {record.enrollment.student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{record.enrollment.student.student_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {record.enrollment.class.name}
                        </div>
                        <div className="text-sm text-gray-500">{record.enrollment.class.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRecord === record.id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="px-2 py-1 text-xs border rounded"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                            <option value="excused">Excused</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        {editingRecord === record.id ? (
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-2 py-1 text-xs border rounded"
                            placeholder="Add notes..."
                          />
                        ) : (
                          <span className="truncate">{record.notes || '-'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingRecord === record.id ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(record.id)}
                              className="text-green-600 hover:text-green-800 mr-2"
                            >
                              ✓ Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              ✕ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(record)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this attendance record?')) {
                                  apiFetch(`/api/admin/attendance/${record.id}`, {
                                    method: 'DELETE'
                                  }).then(fetchRecords)
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              🗑️ Delete
                            </button>
                          </>
                        )}
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
                Showing page {page} of {totalPages} ({totalRecords} total records)
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
      
      {/* Bulk Mark Attendance Modal */}
      {showBulkMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Bulk Mark Attendance</h2>
                <button
                  onClick={() => setShowBulkMarkModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mt-1">Mark attendance for an entire class at once</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Class and Date Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={bulkMarkClass}
                    onChange={(e) => handleBulkMarkClassChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose a class --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={bulkMarkDate}
                    onChange={(e) => setBulkMarkDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              {bulkMarkStudents.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBulkMarkStudents(prev => prev.map(s => ({ ...s, status: 'present' })))}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Mark All Present
                    </button>
                    <button
                      onClick={() => setBulkMarkStudents(prev => prev.map(s => ({ ...s, status: 'absent' })))}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Mark All Absent
                    </button>
                    <button
                      onClick={() => setBulkMarkStudents(prev => prev.map(s => ({ ...s, status: 'late' })))}
                      className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                    >
                      Mark All Late
                    </button>
                  </div>
                </div>
              )}

              {/* Students List */}
              {bulkMarkStudents.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-semibold text-gray-900">
                      Students ({bulkMarkStudents.length})
                    </h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Student
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Student Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bulkMarkStudents.map((student) => (
                          <tr key={student.enrollment_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium text-gray-900">
                                {student.student.first_name} {student.student.last_name}
                              </div>
                              <div className="text-gray-500 text-xs">{student.student.email}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {student.student.student_number || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleBulkMarkStatusToggle(student.enrollment_id, 'present')}
                                  className={`px-3 py-1 text-xs rounded ${
                                    student.status === 'present'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Present
                                </button>
                                <button
                                  onClick={() => handleBulkMarkStatusToggle(student.enrollment_id, 'absent')}
                                  className={`px-3 py-1 text-xs rounded ${
                                    student.status === 'absent'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Absent
                                </button>
                                <button
                                  onClick={() => handleBulkMarkStatusToggle(student.enrollment_id, 'late')}
                                  className={`px-3 py-1 text-xs rounded ${
                                    student.status === 'late'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Late
                                </button>
                                <button
                                  onClick={() => handleBulkMarkStatusToggle(student.enrollment_id, 'excused')}
                                  className={`px-3 py-1 text-xs rounded ${
                                    student.status === 'excused'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  Excused
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : bulkMarkClass ? (
                <div className="text-center py-8 text-gray-500">
                  Loading students...
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Please select a class to view students
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkMarkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkMarkSubmit}
                disabled={bulkMarkLoading || !bulkMarkClass || bulkMarkStudents.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkMarkLoading ? 'Saving...' : `Save Attendance (${bulkMarkStudents.length} students)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
