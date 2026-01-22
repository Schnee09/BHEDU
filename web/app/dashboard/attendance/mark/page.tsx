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
  remarks?: string;
  recordId?: string;
}

interface AttendanceSummary {
  totalStudents: number
  presentCount: number
  absentCount: number
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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
    setHasUnsavedChanges(true)
  }

  const markAll = (status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(student => ({ ...student, status }))
    )
    setHasUnsavedChanges(true)
  }

  const saveAttendance = async () => {
    setSaving(true);
    try {
      // Convert UI view model to Domain types
      const recordsToSave: Partial<AttendanceRecord>[] = students.map(student => ({
        student_id: student.studentId,
        class_id: selectedClass,
        date: date,
        status: student.status === 'unmarked' ? AttendanceStatus.ABSENT : student.status as AttendanceStatus,
        remarks: student.remarks
      }))

      const success = await AttendanceService.markAttendance(recordsToSave);

      if (success) {
        setShowSuccess(true)
        setHasUnsavedChanges(false)
        setTimeout(() => setShowSuccess(false), 3000)
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

      {/* Summary with Progress */}
      {summary && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalStudents}</div>
              <div className="text-xs font-medium text-blue-800 dark:text-blue-300 uppercase tracking-wider">Tổng số</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.presentCount}</div>
              <div className="text-xs font-medium text-green-800 dark:text-green-300 uppercase tracking-wider">Có mặt</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.absentCount}</div>
              <div className="text-xs font-medium text-red-800 dark:text-red-300 uppercase tracking-wider">Vắng</div>
            </div>
            <div className="bg-gray-50 dark:bg-stone-800 p-4 rounded-xl border border-gray-100 dark:border-stone-700">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{summary.unmarkedCount}</div>
              <div className="text-xs font-medium text-gray-800 dark:text-gray-300 uppercase tracking-wider">Chưa điểm danh</div>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{summary.attendanceRate}%</div>
              <div className="text-xs font-medium text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">Tỷ lệ</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-500" 
              style={{ width: `${((summary.totalStudents - summary.unmarkedCount) / summary.totalStudents) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Notification */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Đã lưu điểm danh thành công!</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {students.length > 0 && (
        <div className="bg-white dark:bg-stone-900 border border-gray-200 dark:border-stone-700 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 italic">Đánh dấu nhanh:</span>
            <button
              onClick={() => markAll(AttendanceStatus.PRESENT)}
              className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-600 hover:text-white transition-all text-sm font-medium border border-green-200 dark:border-green-800/50"
            >
              ✅ Tất cả có mặt
            </button>
            <button
              onClick={() => markAll(AttendanceStatus.ABSENT)}
              className="inline-flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-600 hover:text-white transition-all text-sm font-medium border border-red-200 dark:border-red-800/50"
            >
              ❌ Tất cả vắng
            </button>
            {hasUnsavedChanges && (
              <span className="ml-auto text-xs font-medium text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Có thay đổi chưa lưu
              </span>
            )}
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
        <div className="bg-white dark:bg-stone-900 border border-gray-300 dark:border-stone-700 rounded-lg overflow-hidden mb-6">

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-3 mobile-card-list animate-fade-in pb-24">
            {students.map((student) => {
              const statusInfo = getStatusFormatted(student.status)
              return (
                <div
                  key={student.studentId}
                  className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 border border-stone-100 dark:border-[#2C2420] shadow-sm press-effect overflow-hidden relative"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    student.status === AttendanceStatus.PRESENT ? 'bg-green-500' : 
                    student.status === AttendanceStatus.ABSENT ? 'bg-red-500' : 'bg-stone-200'
                  }`} />

                  {/* Student Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-stone-900 dark:text-stone-100 text-lg leading-tight truncate">
                        {student.studentName}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-mono mt-1">
                        {student.studentCode || student.email || 'HS-XXXX'}
                      </p>
                    </div>
                  </div>

                  {/* Status Selector - Large touch-friendly buttons */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.PRESENT)}
                      className={`h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all press-effect tap-target flex items-center justify-center gap-2 ${
                        student.status === AttendanceStatus.PRESENT
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                          : 'bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400 border border-green-100/50 dark:border-green-800/30'
                        }`}
                    >
                      <span className="text-base">✅</span> Có mặt
                    </button>
                    <button
                      onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.ABSENT)}
                      className={`h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all press-effect tap-target flex items-center justify-center gap-2 ${
                        student.status === AttendanceStatus.ABSENT
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400 border border-red-100/50 dark:border-red-800/30'
                        }`}
                    >
                      <span className="text-base">❌</span> Vắng
                    </button>
                    <button
                      onClick={() => updateStudentStatus(student.studentId, 'unmarked')}
                      className={`h-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all press-effect tap-target flex items-center justify-center ${
                         student.status === 'unmarked'
                          ? 'bg-stone-600 text-white shadow-lg shadow-stone-600/20'
                          : 'bg-stone-50 text-stone-500 dark:bg-stone-800/50 dark:text-stone-400 border border-stone-100 dark:border-stone-700'
                        }`}
                    >
                      Chưa
                    </button>
                  </div>

                  {/* Remarks - Now editable on mobile with better styling */}
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                       <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <input 
                       type="text"
                       value={student.remarks || ''}
                       placeholder="Thêm ghi chú..."
                       onChange={(e) => {
                         const newVal = e.target.value;
                         setStudents(prev => prev.map(s => s.studentId === student.studentId ? {...s, remarks: newVal} : s))
                         setHasUnsavedChanges(true)
                       }}
                       className="w-full text-sm bg-stone-50/50 dark:bg-white/5 border border-stone-100 dark:border-[#2C2420] rounded-xl pl-9 pr-4 py-3 focus:border-amber-500 dark:focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-stone-400 dark:placeholder:text-stone-600"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto table-scroll-container">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-stone-700">
              <thead className="bg-gray-50 dark:bg-stone-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Mã học sinh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-stone-900 divide-y divide-gray-200 dark:divide-stone-700">
                {students.map((student, idx) => {
                  const statusInfo = getStatusFormatted(student.status)
                  return (
                    <tr key={student.studentId || idx} className="hover:bg-gray-50 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {student.studentName}
                          <span className="text-[8px] text-gray-300 ml-1">#{idx+1}</span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{student.studentCode || student.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {student.studentCode || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={student.status}
                          onChange={(e) => updateStudentStatus(student.studentId, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor} border-0 focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="unmarked">Chưa điểm danh</option>
                          <option value={AttendanceStatus.PRESENT}>✅ Có mặt</option>
                          <option value={AttendanceStatus.ABSENT}>❌ Vắng</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <input 
                           type="text"
                           value={student.remarks || ''}
                           placeholder="Ghi chú..."
                           onChange={(e) => {
                             const newVal = e.target.value;
                             setStudents(prev => prev.map(s => s.studentId === student.studentId ? {...s, remarks: newVal} : s))
                           }}
                           className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sticky Mobile Save Button / Desktop Save Section */}
      {students.length > 0 && (
        <div className="fixed md:relative bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-auto 
          bg-white/80 dark:bg-stone-900/80 backdrop-blur-lg md:bg-transparent p-4 md:p-0 
          border-t border-gray-200 dark:border-stone-800 md:border-none z-40 md:z-0
          pb-safe md:pb-0">
          <div className="max-w-7xl mx-auto flex justify-end gap-3 md:gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 md:flex-none bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-6 py-3 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 font-bold transition-all active:scale-[0.98]"
            >
              Hủy
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="flex-[2] md:flex-none bg-green-600 text-white px-10 py-3 rounded-xl hover:bg-green-700 active:bg-green-800 disabled:bg-stone-400 font-bold shadow-lg shadow-green-600/20 dark:shadow-none transition-all active:scale-[0.98]"
            >
              {saving ? 'Đang lưu...' : 'Lưu điểm danh'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

