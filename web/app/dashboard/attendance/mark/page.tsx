/**
 * Attendance Marking Page
 * Quick interface for teachers to mark class attendance
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import {
  AttendanceStatus,
  AttendanceRecord
} from '@/lib/attendance/types'
import { AttendanceService } from '@/lib/attendance/services/AttendanceService'

// Types
interface Class {
  id: string
  name: string
}

interface StudentAttendanceView {
  studentId: string;
  studentName: string;
  studentCode?: string;
  email?: string;
  status: AttendanceStatus | 'unmarked';
  checkInTime?: string;
  notes?: string;
  // Metadata for matching with DB record
  recordId?: string;
}

interface AttendanceSummary {
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  unmarkedCount: number
  attendanceRate: number
}

// Helpers
const getStatusFormatted = (status: string) => {
  switch (status) {
    case AttendanceStatus.PRESENT: return { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Có mặt' };
    case AttendanceStatus.ABSENT: return { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Vắng' };
    default: return { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Chưa điểm danh' };
  }
};

export default function AttendanceMarkingPage() {
  const router = useRouter()

  // Selection State
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Data State
  const [students, setStudents] = useState<StudentAttendanceView[]>([])
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)

  // UI State
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load teacher's classes on mount
  useEffect(() => {
    loadClasses()
  }, [])

  // Load attendance when class or date changes
  useEffect(() => {
    if (selectedClass && date) {
      loadAttendance()
    }
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
      // Use the Service to fetch daily attendance
      // Note: The API response format from previous implementation seems specific 
      // (contains students list + summary). We might need to keep using the existing 
      // endpoint via Service or directly if it's a composite view.
      // For now, let's stick to the existing endpoint pattern but filtered through our understanding.

      const response = await apiFetch(
        `/api/attendance/class/${selectedClass}?date=${date}`
      )

      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
        setSummary(data.summary || null)
      } else {
        alert('Không thể tải điểm danh')
      }
    } catch (error) {
      console.error('Failed to load attendance', error)
      alert('Không thể tải điểm danh')
    } finally {
      setLoading(false)
    }
  }

  const updateStudentStatus = (studentId: string, status: string) => {
    setStudents(prev =>
      prev.map(student =>
        student.studentId === studentId
          ? { ...student, status: status as any }
          : student
      )
    )
  }

  const markAll = (status: AttendanceStatus) => {
    const confirmed = confirm(`Đánh dấu tất cả học sinh là ${status === 'present' ? 'Có mặt' : 'Vắng'}?`)
    if (!confirmed) return

    setStudents(prev =>
      prev.map(student => ({ ...student, status }))
    )
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      // Convert UI view model to Domain types
      const recordsToSave: Partial<AttendanceRecord>[] = students.map(student => ({
        student_id: student.studentId,
        class_id: selectedClass,
        date: date,
        status: student.status === 'unmarked' ? AttendanceStatus.ABSENT : student.status as AttendanceStatus,
        remarks: student.notes
      }))

      const success = await AttendanceService.markAttendance(recordsToSave);

      if (success) {
        alert(`Đã lưu điểm danh thành công!`)
        loadAttendance() // Reload to refresh summary
      } else {
        alert('Không thể lưu điểm danh')
      }
    } catch (error) {
      console.error('Failed to save attendance', error)
      alert('Không thể lưu điểm danh')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Điểm Danh</h1>
        <p className="text-gray-600">
          Điểm danh nhanh cho lớp học của bạn
        </p>
      </div>

      {/* Class and Date Selection */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Lớp học</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Ngày</label>
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
              {loading ? 'Đang tải...' : 'Load Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.totalStudents}</div>
            <div className="text-sm text-gray-600">Tổng</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.presentCount}</div>
            <div className="text-sm text-gray-600">Có mặt</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.absentCount}</div>
            <div className="text-sm text-gray-600">Vắng</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summary.lateCount}</div>
            <div className="text-sm text-gray-600">Đến muộn</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{summary.excusedCount}</div>
            <div className="text-sm text-gray-600">Có phép</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{summary.unmarkedCount}</div>
            <div className="text-sm text-gray-600">Chưa điểm danh</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-indigo-600">{summary.attendanceRate}%</div>
            <div className="text-sm text-gray-600">Tỷ lệ</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium self-center mr-2">Đánh dấu nhanh:</span>
            <button
              onClick={() => markAll(AttendanceStatus.PRESENT)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm transition"
            >
              Tất cả có mặt
            </button>
            <button
              onClick={() => markAll(AttendanceStatus.ABSENT)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm transition"
            >
              Tất cả vắng
            </button>
          </div>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải điểm danh...</div>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Chọn lớp và ngày để xem điểm danh</div>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giờ check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => {
                  const statusInfo = getStatusFormatted(student.status)
                  return (
                    <tr key={student.studentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {student.studentName}
                        </div>
                        <div className="text-sm text-gray-500">{student.studentCode || student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.studentCode || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={student.status}
                          onChange={(e) => updateStudentStatus(student.studentId, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor} border-0`}
                        >
                          <option value="unmarked">Chưa điểm danh</option>
                          <option value={AttendanceStatus.PRESENT}>✅ Có mặt</option>
                          <option value={AttendanceStatus.ABSENT}>❌ Vắng</option>
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
            {saving ? 'Đang lưu...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}

