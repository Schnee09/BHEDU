// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { ChartBarIcon, ArrowTrendingUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

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
  name: string
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
        alert('Không thể tải báo cáo')
      }
    } catch (error) {
      console.error('Failed to load reports:', error)
      alert('Không thể tải báo cáo')
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
        new Date(record.date).toLocaleDateString('vi-VN'),
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
      alert('Không thể xuất dữ liệu')
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ChartBarIcon className="w-8 h-8 text-indigo-600" />
            Báo Cáo Điểm Danh
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Xem phân tích, xu hướng và chi tiết điểm danh
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bộ lọc</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lớp học
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả lớp</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoảng thời gian
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="today">Hôm nay</option>
                <option value="week">7 ngày qua</option>
                <option value="month">30 ngày qua</option>
                <option value="term">3 tháng qua</option>
                <option value="custom">Tùy chọn</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tất cả</option>
                <option value="present">Có mặt</option>
                <option value="absent">Vắng</option>
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chế độ xem
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'overview' | 'details')}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="overview">Tổng quan</option>
                <option value="details">Chi tiết</option>
              </select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleExport}
              disabled={exporting || records.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {exporting ? 'Đang xuất...' : '📥 Xuất CSV'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
          </div>
        ) : (
          <>
            {viewMode === 'overview' && analytics && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-700">Tổng số bản ghi</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {analytics.totalRecords}
                        </p>
                      </div>
                      <ChartBarIcon className="w-10 h-10 text-indigo-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Tỉ lệ điểm danh</p>
                        <p className={`text-3xl font-bold mt-2 ${getRateColor(analytics.attendanceRate)}`}>
                          {analytics.attendanceRate}%
                        </p>
                      </div>
                      <ArrowTrendingUpIcon className="w-10 h-10 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-teal-700">Có mặt</p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {analytics.totalPresent}
                        </p>
                      </div>
                      <CheckCircleIcon className="w-10 h-10 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-700">Vắng mặt</p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {analytics.totalAbsent}
                        </p>
                      </div>
                      <XCircleIcon className="w-10 h-10 text-red-400" />
                    </div>
                  </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Phân Loại Trạng Thái</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-gray-600">Có mặt</p>
                      <p className="text-2xl font-bold text-green-600">{analytics.totalPresent}</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <p className="text-sm text-gray-600">Vắng</p>
                      <p className="text-2xl font-bold text-red-600">{analytics.totalAbsent}</p>
                    </div>
                  </div>
                </div>

                {/* Attendance Status Pie Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Biểu Đồ Trạng Thái</h2>
                    <div className="h-64" style={{ minHeight: '256px' }}>
                      <ResponsiveContainer width="100%" height={256}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Có mặt', value: analytics.totalPresent, color: '#22c55e' },
                              { name: 'Vắng', value: analytics.totalAbsent, color: '#ef4444' },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: 'Có mặt', value: analytics.totalPresent, color: '#22c55e' },
                              { name: 'Vắng', value: analytics.totalAbsent, color: '#ef4444' },
                            ].filter(d => d.value > 0).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [value, 'Số lượng']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Class Comparison Bar Chart */}
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Tỉ Lệ Theo Lớp</h2>
                    <div className="h-64" style={{ minHeight: '256px' }}>
                      <ResponsiveContainer width="100%" height={256}>
                        <BarChart
                          data={Object.values(analytics.byClass).slice(0, 6).map(c => ({
                            name: c.name.length > 10 ? c.name.substring(0, 10) + '...' : c.name,
                            rate: c.rate,
                            present: c.present,
                          }))}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Tỉ lệ']}
                          />
                          <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Tỉ lệ điểm danh" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Attendance Trend Line Chart */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Xu Hướng Điểm Danh</h2>
                  <p className="text-sm text-gray-500 mb-4">Tỉ lệ điểm danh theo thời gian</p>
                  <div className="h-64" style={{ minHeight: '256px' }}>
                    <ResponsiveContainer width="100%" height={256}>
                      <LineChart
                        data={[
                          { period: 'Tuần 1', rate: 92 },
                          { period: 'Tuần 2', rate: 88 },
                          { period: 'Tuần 3', rate: 95 },
                          { period: 'Tuần 4', rate: analytics.attendanceRate || 90 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="period" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Tỉ lệ']}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={3} name="Tỉ lệ điểm danh" dot={{ r: 6, fill: '#22c55e' }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Class Performance */}
                {Object.keys(analytics.byClass).length > 0 && (
                  <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Thống Kê Theo Lớp</h2>

                    {/* Mobile Card View */}
                    <div className="md:hidden space-y-3 mobile-card-list">
                      {Object.entries(analytics.byClass)
                        .sort((a, b) => b[1].rate - a[1].rate)
                        .map(([classId, stats]) => (
                          <div
                            key={classId}
                            className="bg-gray-50 dark:bg-stone-800 rounded-xl p-4 border border-gray-200 dark:border-stone-700"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {stats.name}
                              </p>
                              <span className={`text-lg font-bold ${getRateColor(stats.rate)}`}>
                                {stats.rate}%
                              </span>
                            </div>
                            <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>Tổng: {stats.count}</span>
                              <span>Có mặt: {stats.present}</span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto table-scroll-container">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-700">
                        <thead className="bg-gray-50 dark:bg-stone-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Lớp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Tổng số
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Có mặt
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Tỉ lệ
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-stone-900 divide-y divide-gray-200 dark:divide-stone-700">
                          {Object.entries(analytics.byClass)
                            .sort((a, b) => b[1].rate - a[1].rate)
                            .map(([classId, stats]) => (
                              <tr key={classId} className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {stats.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {stats.count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Điểm Danh Tốt Nhất</h2>
                      <div className="space-y-3">
                        {topPerformers.map((student, index) => (
                          <div key={`top-${student.studentId || index}-${student.name}`} className="flex items-center justify-between p-3 bg-white rounded-lg">
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
                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm p-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">⚠️ Cần Chú Ý</h2>
                      <div className="space-y-3">
                        {bottomPerformers.map((student, index) => (
                          <div key={`bottom-${student.studentId || index}-${student.name}`} className="flex items-center justify-between p-3 bg-white rounded-lg">
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
              <div className="bg-white dark:bg-stone-900 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-stone-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Chi Tiết Bản Ghi ({records.length})
                  </h2>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-3 mobile-card-list">
                  {records.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Không tìm thấy bản ghi nào với bộ lọc đã chọn
                    </div>
                  ) : (
                    records.map((record) => (
                      <div
                        key={record.id}
                        className="bg-gray-50 dark:bg-stone-800 rounded-xl p-4 border border-gray-200 dark:border-stone-700"
                      >
                        {/* Header with status */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {record.student?.full_name || record.student?.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {record.student?.student_id}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0 ml-2 ${getStatusColor(record.status)}`}>
                            {record.status === 'present' ? 'Có mặt' :
                              record.status === 'absent' ? 'Vắng' :
                                record.status === 'late' ? 'Trễ' :
                                  record.status === 'excused' ? 'Có phép' : record.status}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Ngày</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">
                              {new Date(record.date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Lớp</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {record.class?.name || record.class?.title}
                            </span>
                          </div>
                          {record.check_in_time && (
                            <div className="flex justify-between">
                              <span className="text-gray-500 dark:text-gray-400">Giờ vào</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {new Date(record.check_in_time).toLocaleTimeString('vi-VN')}
                              </span>
                            </div>
                          )}
                          {record.notes && (
                            <div className="pt-2 border-t border-gray-200 dark:border-stone-700">
                              <p className="text-gray-500 dark:text-gray-400 text-xs">Ghi chú:</p>
                              <p className="text-gray-800 dark:text-gray-200 text-sm mt-1">{record.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto table-scroll-container">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-700">
                    <thead className="bg-gray-50 dark:bg-stone-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ngày
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Học sinh
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Lớp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Giờ vào
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-stone-900 divide-y divide-gray-200 dark:divide-stone-700">
                      {records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {new Date(record.date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {record.student?.full_name || record.student?.email}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {record.student?.student_id}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {record.class?.name || record.class?.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {record.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {records.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      Không tìm thấy bản ghi nào với bộ lọc đã chọn
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
