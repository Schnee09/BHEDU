'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { ChartBarIcon, ArrowTrendingUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface AttendanceRecord {
  id: string
  student_id: string
  class_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused' | 'half_day'
  check_in_time: string | null
  check_out_time: string | null
  notes: string | null
  student: {
    id: string
    email: string
    full_name: string
    student_id: string
    grade_level: string
  }
  class: {
    id: string
    title: string
    code: string
  }
}

interface Analytics {
  totalRecords: number
  totalPresent: number
  totalAbsent: number
  totalLate: number
  totalExcused: number
  totalHalfDay: number
  attendanceRate: number
  byStatus: Record<string, number>
  byClass: Record<string, { name: string; count: number; present: number; rate: number }>
  byStudent: Record<string, { name: string; studentId: string; count: number; present: number; rate: number }>
}

interface ClassOption {
  id: string
  title: string
}

export default function AttendanceReportsPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filters
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('week')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview')

  useEffect(() => {
    loadClasses()
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, dateRange, startDate, endDate, statusFilter])

  const loadClasses = async () => {
    try {
      const response = await apiFetch('/api/classes/my-classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data.data || data.classes || [])
      }
    } catch (error) {
      console.error('Failed to load classes:', error)
    }
  }

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // Calculate date range
      const today = new Date()
      let start = ''
      let end = today.toISOString().split('T')[0]

      if (dateRange === 'today') {
        start = end
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        start = weekAgo.toISOString().split('T')[0]
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        start = monthAgo.toISOString().split('T')[0]
      } else if (dateRange === 'term') {
        const termStart = new Date(today)
        termStart.setMonth(termStart.getMonth() - 3)
        start = termStart.toISOString().split('T')[0]
      } else if (dateRange === 'custom') {
        start = startDate
        end = endDate
      }

      const params = new URLSearchParams()
      if (selectedClass) params.append('classId', selectedClass)
      if (start) params.append('startDate', start)
      if (end) params.append('endDate', end)
      if (statusFilter) params.append('status', statusFilter)

      const response = await apiFetch(`/api/attendance/reports?${params}`)
      if (response.ok) {
        const result = await response.json()
        setRecords(result.data || [])
        setAnalytics(result.analytics || null)
      } else {
        alert('Failed to load reports')
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
      alert('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (records.length === 0) {
      alert('No data to export')
      return
    }

    setExporting(true)
    try {
      // Create CSV content
      const headers = ['Date', 'Student Name', 'Student ID', 'Class', 'Status', 'Check In', 'Check Out', 'Notes']
      const rows = records.map(record => [
        new Date(record.date).toLocaleDateString(),
        record.student?.full_name || record.student?.email || '',
        record.student?.student_id || '',
        record.class?.title || '',
        record.status,
        record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '',
        record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '',
        record.notes || ''
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      late: 'bg-yellow-100 text-yellow-800',
      excused: 'bg-blue-100 text-blue-800',
      half_day: 'bg-purple-100 text-purple-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 85) return 'text-blue-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Get top and bottom performers
  const studentStats = analytics ? Object.values(analytics.byStudent).sort((a, b) => b.rate - a.rate) : []
  const topPerformers = studentStats.slice(0, 5)
  const bottomPerformers = studentStats.slice(-5).reverse()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="mt-2 text-sm text-gray-600">
            View attendance analytics, trends, and detailed records
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="term">Last 3 Months</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                View
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'overview' | 'details')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="details">Detailed Records</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleExport}
              disabled={exporting || records.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : '📥 Export to CSV'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        ) : (
          <>
            {viewMode === 'overview' && analytics && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Records</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {analytics.totalRecords}
                        </p>
                      </div>
                      <ChartBarIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                        <p className={`text-3xl font-bold mt-2 ${getRateColor(analytics.attendanceRate)}`}>
                          {analytics.attendanceRate}%
                        </p>
                      </div>
                      <ArrowTrendingUpIcon className="w-10 h-10 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Present</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {analytics.totalPresent}
                        </p>
                      </div>
                        <CheckCircleIcon className="w-10 h-10 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Absent</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {analytics.totalAbsent}
                        </p>
                      </div>
                        <XCircleIcon className="w-10 h-10 text-red-400" />
                    </div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Present</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.totalPresent}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{analytics.totalAbsent}</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-gray-600">Late</p>
                      <p className="text-2xl font-bold text-yellow-600">{analytics.totalLate}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Excused</p>
                      <p className="text-2xl font-bold text-blue-600">{analytics.totalExcused}</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Half Day</p>
                      <p className="text-2xl font-bold text-purple-600">{analytics.totalHalfDay}</p>
                    </div>
                  </div>
                </div>

                {/* Class Performance */}
                {Object.keys(analytics.byClass).length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Performance</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Class
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Records
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Present/Equivalent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance Rate
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(analytics.byClass)
                            .sort((a, b) => b[1].rate - a[1].rate)
                            .map(([classId, stats]) => (
                              <tr key={classId}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {stats.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {stats.count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {stats.present}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <span className={`font-semibold ${getRateColor(stats.rate)}`}>
                                    {stats.rate}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Student Performance */}
                {studentStats.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Performers */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Attendance</h2>
                      <div className="space-y-3">
                        {topPerformers.map((student, index) => (
                          <div key={`top-${student.studentId || index}-${student.name}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-600">{student.studentId}</p>
                              </div>
                            </div>
                            <span className={`text-lg font-bold ${getRateColor(student.rate)}`}>
                              {student.rate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Performers */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Needs Attention</h2>
                      <div className="space-y-3">
                        {bottomPerformers.map((student, index) => (
                          <div key={`bottom-${student.studentId || index}-${student.name}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-600">{student.studentId}</p>
                            </div>
                            <span className={`text-lg font-bold ${getRateColor(student.rate)}`}>
                              {student.rate}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {viewMode === 'details' && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Detailed Records ({records.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Notes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.student?.full_name || record.student?.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {record.student?.student_id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.class?.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {record.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {records.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No records found for the selected filters
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
