/**
 * Attendance Marking Page
 * Quick interface for teachers to mark class attendance
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  formatAttendanceStatus,
  validateAttendanceDate,
  exportAttendanceToCSV,
  type StudentAttendanceRecord 
} from '@/lib/attendanceService'
import { apiFetch } from '@/lib/api/client'

interface Class {
  id: string
  title: string
}

export default function AttendanceMarkingPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<StudentAttendanceRecord[]>([])
  const [summary, setSummary] = useState<{
    totalStudents: number
    presentCount: number
    absentCount: number
    lateCount: number
    excusedCount: number
    halfDayCount: number
    unmarkedCount: number
    attendanceRate: number
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [classInfo, setClassInfo] = useState<{ id: string; title: string } | null>(null)

  // Load teacher's classes on mount
  useEffect(() => {
    loadClasses()
  }, [])

  // Load attendance when class or date changes
  useEffect(() => {
    if (selectedClass && date) {
      loadAttendance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, date])

  const loadClasses = async () => {
    try {
      const response = await apiFetch('/api/classes/my-classes')
      if (response.ok) {
        const data = await response.json()
        const classList = data.data || data.classes || []
        setClasses(classList)
        if (classList.length > 0) {
          setSelectedClass(classList[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load classes', error)
      setClasses([])
    }
  }

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const response = await apiFetch(
        `/api/attendance/class/${selectedClass}?date=${date}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
        setSummary(data.summary || null)
        setClassInfo(data.class || null)
      } else {
        alert('Failed to load attendance')
      }
    } catch (error) {
      console.error('Failed to load attendance', error)
      alert('Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const updateStudentStatus = (studentId: string, status: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.studentId === studentId
          ? { ...student, status }
          : student
      )
    )
  }

  const markAll = (status: string) => {
    const confirmed = confirm(`Mark all students as ${status}?`)
    if (!confirmed) return

    setStudents(prev =>
      prev.map(student => ({ ...student, status }))
    )
  }

  const saveAttendance = async () => {
    const validation = validateAttendanceDate(date)
    if (!validation.valid) {
      alert(validation.error)
      return
    }

    setSaving(true)
    try {
      const records = students.map(student => ({
        studentId: student.studentId,
        classId: selectedClass,
        date: date,
        status: student.status === 'unmarked' ? 'absent' : student.status,
        checkInTime: student.checkInTime || undefined,
        checkOutTime: student.checkOutTime || undefined,
        notes: student.notes || undefined
      }))

      const response = await apiFetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId: selectedClass,
          date: date,
          records
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Attendance saved! ${data.results.successCount} students marked successfully.`)
        loadAttendance() // Reload to show updated data
      } else {
        alert(data.error || 'Failed to save attendance')
      }
    } catch (error) {
      console.error('Failed to save attendance', error)
      alert('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const exportCSV = () => {
    if (!classInfo) return
    
    const csv = exportAttendanceToCSV(students, classInfo.title, date)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${classInfo.title}-${date}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mark Attendance</h1>
        <p className="text-gray-600">
          Quickly mark attendance for your class
        </p>
      </div>

      {/* Class and Date Selection */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={loadAttendance}
              disabled={loading || !selectedClass}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 w-full transition"
            >
              {loading ? 'Loading...' : 'Load Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.totalStudents}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.presentCount}</div>
            <div className="text-sm text-gray-600">Present</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.absentCount}</div>
            <div className="text-sm text-gray-600">Absent</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summary.lateCount}</div>
            <div className="text-sm text-gray-600">Late</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.excusedCount}</div>
            <div className="text-sm text-gray-600">Excused</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{summary.unmarkedCount}</div>
            <div className="text-sm text-gray-600">Unmarked</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{summary.attendanceRate}%</div>
            <div className="text-sm text-gray-600">Rate</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium self-center mr-2">Quick Mark:</span>
            <button
              onClick={() => markAll('present')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm transition"
            >
              ✁EAll Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm transition"
            >
              ✁EAll Absent
            </button>
            <button
              onClick={exportCSV}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm transition ml-auto"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading attendance...</div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Select a class and date to view attendance</div>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const statusInfo = formatAttendanceStatus(student.status)
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.studentNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={student.status}
                          onChange={(e) => updateStudentStatus(student.studentId, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor} border-0`}
                        >
                          <option value="unmarked">Unmarked</option>
                          <option value="present">✁EPresent</option>
                          <option value="absent">✁EAbsent</option>
                          <option value="late">⏰ Late</option>
                          <option value="excused">📝 Excused</option>
                          <option value="half_day">🕐 Half Day</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.checkInTime || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.notes || '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-300 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
          >
            {saving ? 'Saving...' : '💾 Save Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}
