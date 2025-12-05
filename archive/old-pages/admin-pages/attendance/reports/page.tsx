'use client'

/**
 * Admin Attendance Reports Page
 * View attendance summaries and generate reports
 */

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'

interface Class {
  id: string
  name: string
  code: string
}

interface StudentSummary {
  student_id: string
  student_name: string
  student_number: string
  total_days: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_rate: number
}

interface ClassSummary {
  class_id: string
  class_name: string
  class_code: string
  total_students: number
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_rate: number
}

interface DailyAttendance {
  date: string
  total_records: number
  present: number
  absent: number
  late: number
  excused: number
  attendance_rate: number
}

export default function AttendanceReportsPage() {
  const [activeTab, setActiveTab] = useState<'student' | 'class' | 'daily'>('student')
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedClass, setSelectedClass] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Data
  const [studentSummaries, setStudentSummaries] = useState<StudentSummary[]>([])
  const [classSummaries, setClassSummaries] = useState<ClassSummary[]>([])
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([])

  useEffect(() => {
    fetchClasses()
    // Set default date range (last 30 days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchReports()
    }
  }, [activeTab, selectedClass, startDate, endDate])

  const fetchClasses = async () => {
    try {
      const res = await apiFetch('/api/admin/classes?limit=1000')
      const response = await res.json()
      setClasses(response.data || response.classes || [])
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })
      if (selectedClass) params.append('class_id', selectedClass)

      // Fetch all attendance records for the date range
      const res = await apiFetch(`/api/admin/attendance?${params}&limit=10000`)
      const response = await res.json()
      const records = response.data || response.records || []

      if (activeTab === 'student') {
        calculateStudentSummaries(records)
      } else if (activeTab === 'class') {
        calculateClassSummaries(records)
      } else if (activeTab === 'daily') {
        calculateDailyAttendance(records)
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStudentSummaries = (records: any[]) => {
    const studentMap = new Map<string, StudentSummary>()

    records.forEach((record: any) => {
      const studentId = record.student_id
      const student = record.student
      if (!student) return

      if (!studentMap.has(studentId)) {
        studentMap.set(studentId, {
          student_id: studentId,
          student_name: student.full_name || student.email || 'Unknown',
          student_number: '', // Not available in current schema
          total_days: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendance_rate: 0
        })
      }

      const summary = studentMap.get(studentId)!
      summary.total_days++
      if (record.status === 'present') summary.present++
      if (record.status === 'absent') summary.absent++
      if (record.status === 'late') summary.late++
      if (record.status === 'excused') summary.excused++
    })

    // Calculate attendance rate
    const summaries = Array.from(studentMap.values()).map(s => ({
      ...s,
      attendance_rate: s.total_days > 0 ? ((s.present + s.late) / s.total_days) * 100 : 0
    }))

    summaries.sort((a, b) => a.student_name.localeCompare(b.student_name))
    setStudentSummaries(summaries)
  }

  const calculateClassSummaries = (records: any[]) => {
    const classMap = new Map<string, ClassSummary>()
    const studentsByClass = new Map<string, Set<string>>()

    records.forEach((record: any) => {
      const classId = record.class_id
      const studentId = record.student_id
      const classData = record.class

      if (!classData) return

      if (!classMap.has(classId)) {
        classMap.set(classId, {
          class_id: classId,
          class_name: classData.name || 'Unknown',
          class_code: '', // Not available in current schema
          total_students: 0,
          total_records: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendance_rate: 0
        })
        studentsByClass.set(classId, new Set())
      }

      const summary = classMap.get(classId)!
      studentsByClass.get(classId)!.add(studentId)
      summary.total_records++
      if (record.status === 'present') summary.present++
      if (record.status === 'absent') summary.absent++
      if (record.status === 'late') summary.late++
      if (record.status === 'excused') summary.excused++
    })

    // Calculate attendance rate and unique students
    const summaries = Array.from(classMap.values()).map(s => ({
      ...s,
      total_students: studentsByClass.get(s.class_id)?.size || 0,
      attendance_rate: s.total_records > 0 ? ((s.present + s.late) / s.total_records) * 100 : 0
    }))

    summaries.sort((a, b) => a.class_name.localeCompare(b.class_name))
    setClassSummaries(summaries)
  }

  const calculateDailyAttendance = (records: any[]) => {
    const dailyMap = new Map<string, DailyAttendance>()

    records.forEach((record: any) => {
      const date = record.date
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          total_records: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendance_rate: 0
        })
      }

      const daily = dailyMap.get(date)!
      daily.total_records++
      if (record.status === 'present') daily.present++
      if (record.status === 'absent') daily.absent++
      if (record.status === 'late') daily.late++
      if (record.status === 'excused') daily.excused++
    })

    // Calculate attendance rate
    const daily = Array.from(dailyMap.values()).map(d => ({
      ...d,
      attendance_rate: d.total_records > 0 ? ((d.present + d.late) / d.total_records) * 100 : 0
    }))

    daily.sort((a, b) => b.date.localeCompare(a.date)) // Most recent first
    setDailyAttendance(daily)
  }

  const exportToCSV = () => {
    let headers: string[] = []
    let rows: string[][] = []

    if (activeTab === 'student') {
      headers = ['Student Name', 'Student Number', 'Total Days', 'Present', 'Absent', 'Late', 'Excused', 'Attendance Rate']
      rows = studentSummaries.map(s => [
        s.student_name,
        s.student_number,
        s.total_days.toString(),
        s.present.toString(),
        s.absent.toString(),
        s.late.toString(),
        s.excused.toString(),
        `${s.attendance_rate.toFixed(2)}%`
      ])
    } else if (activeTab === 'class') {
      headers = ['Class Name', 'Class Code', 'Total Students', 'Total Records', 'Present', 'Absent', 'Late', 'Excused', 'Attendance Rate']
      rows = classSummaries.map(c => [
        c.class_name,
        c.class_code,
        c.total_students.toString(),
        c.total_records.toString(),
        c.present.toString(),
        c.absent.toString(),
        c.late.toString(),
        c.excused.toString(),
        `${c.attendance_rate.toFixed(2)}%`
      ])
    } else if (activeTab === 'daily') {
      headers = ['Date', 'Total Records', 'Present', 'Absent', 'Late', 'Excused', 'Attendance Rate']
      rows = dailyAttendance.map(d => [
        d.date,
        d.total_records.toString(),
        d.present.toString(),
        d.absent.toString(),
        d.late.toString(),
        d.excused.toString(),
        `${d.attendance_rate.toFixed(2)}%`
      ])
    }

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600'
    if (rate >= 90) return 'text-blue-600'
    if (rate >= 80) return 'text-yellow-600'
    if (rate >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600 mt-1">View attendance summaries and analytics</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          📥 Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="font-semibold text-gray-900">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('student')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'student'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By Student
            </button>
            <button
              onClick={() => setActiveTab('class')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'class'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              By Class
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'daily'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Daily Overview
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading report...</p>
            </div>
          ) : (
            <>
              {/* Student Summary Tab */}
              {activeTab === 'student' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Student Attendance Summary ({studentSummaries.length} students)
                  </h3>
                  {studentSummaries.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student #</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Excused</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {studentSummaries.map((summary) => (
                            <tr key={summary.student_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {summary.student_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {summary.student_number || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {summary.total_days}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {summary.present}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {summary.absent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                {summary.late}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                {summary.excused}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getAttendanceRateColor(summary.attendance_rate)}`}>
                                {summary.attendance_rate.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Class Summary Tab */}
              {activeTab === 'class' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Class Attendance Summary ({classSummaries.length} classes)
                  </h3>
                  {classSummaries.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Records</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Excused</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {classSummaries.map((summary) => (
                            <tr key={summary.class_id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {summary.class_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {summary.class_code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {summary.total_students}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {summary.total_records}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {summary.present}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {summary.absent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                {summary.late}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                {summary.excused}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getAttendanceRateColor(summary.attendance_rate)}`}>
                                {summary.attendance_rate.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Daily Overview Tab */}
              {activeTab === 'daily' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Daily Attendance Overview ({dailyAttendance.length} days)
                  </h3>
                  {dailyAttendance.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">No data available</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Records</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Excused</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dailyAttendance.map((daily) => (
                            <tr key={daily.date} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {new Date(daily.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {daily.total_records}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                {daily.present}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {daily.absent}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                {daily.late}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                {daily.excused}
                              </td>
                              <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getAttendanceRateColor(daily.attendance_rate)}`}>
                                {daily.attendance_rate.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
