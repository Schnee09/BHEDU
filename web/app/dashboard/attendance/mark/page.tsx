'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch, getClasses, getClassStudents, getAttendance, bulkCreateAttendance } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import {
  AttendanceStatus,
  AttendanceRecord
} from '@/lib/attendance/types'

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
      // Fetch classes (defaults to my-classes for teachers if backend handles context, 
      // or we can use specific endpoint if needed, but getClasses is V2 standard)
      // We pass pageSize: 100 to get a good list.
      const res = await getClasses({ limit: 100 });
      const classList = (res.data || []) as any[];
      setClasses(classList.map(c => ({ id: c.id, name: c.name })));

      if (classList.length > 0) {
        setSelectedClass(classList[0].id)
      }
    } catch (error) {
      console.error('Failed to load classes', error)
      setClasses([])
    }
  }

  const loadAttendance = async () => {
    setLoading(true)
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        getClassStudents(selectedClass),
        getAttendance({ class_id: selectedClass, date: date, limit: 1000 })
      ]);

      const classStudents = studentsRes || [];
      const attendanceRecords = attendanceRes.data || [];

      // Map students and merge with attendance
      const mappedStudents: StudentAttendanceView[] = classStudents.map((s: any) => {
        const record = attendanceRecords.find((r: any) => r.student_id === s.id);
        return {
          studentId: s.id,
          studentName: s.full_name || s.name || 'Unknown',
          studentCode: s.student_code || s.student_id || '', // Adjust based on profile schema
          email: s.email,
          status: record ? (record.status as AttendanceStatus) : 'unmarked',
          remarks: record?.notes || record?.remarks || '',
          recordId: record?.id
        };
      });

      setStudents(mappedStudents);
      calculateSummary(mappedStudents);
      setHasUnsavedChanges(false);

    } catch (error) {
      console.error('Failed to load attendance', error)
      alert('Không thể tải dữ liệu điểm danh')
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (currentStudents: StudentAttendanceView[]) => {
    const total = currentStudents.length;
    const present = currentStudents.filter(s => s.status === AttendanceStatus.PRESENT).length;
    const absent = currentStudents.filter(s => s.status === AttendanceStatus.ABSENT).length;
    const unmarked = currentStudents.filter(s => s.status === 'unmarked').length;

    const denominator = present + absent;
    const rate = denominator > 0 ? Math.round((present / denominator) * 100) : 0;

    setSummary({
      totalStudents: total,
      presentCount: present,
      absentCount: absent,
      unmarkedCount: unmarked,
      attendanceRate: rate
    });
  }

  const updateStudentStatus = (studentId: string, status: string) => {
    setStudents(prev => {
      const updated = prev.map(student =>
        student.studentId === studentId
          ? { ...student, status: status as any }
          : student
      );
      calculateSummary(updated);
      return updated;
    })
    setHasUnsavedChanges(true)
  }

  const markAll = (status: AttendanceStatus) => {
    setStudents(prev => {
      const updated = prev.map(student => ({ ...student, status }));
      calculateSummary(updated);
      return updated;
    })
    setHasUnsavedChanges(true)
  }

  const saveAttendance = async () => {
    setSaving(true);
    try {
      // Filter out unmarked if we don't want to save them
      const recordsToSave = students
        .filter(s => s.status !== 'unmarked')
        .map(student => ({
          student_id: student.studentId,
          status: student.status,
          notes: student.remarks
        }));

      if (recordsToSave.length === 0) {
        setShowSuccess(true);
        setHasUnsavedChanges(false);
        setSaving(false);
        return;
      }

      await bulkCreateAttendance({
        class_id: selectedClass,
        date: date,
        records: recordsToSave
      });

      setShowSuccess(true)
      setHasUnsavedChanges(false)
      setTimeout(() => setShowSuccess(false), 3000)
      loadAttendance() // Reload to refresh/sync IDs
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
              {loading ? 'Đang tải...' : 'Tải dữ liệu'}
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
                  className={cn(
                    "glass-premium rounded-[32px] p-6 mb-4 border transition-all animate-fade-in-up press-effect relative overflow-hidden",
                    student.status !== 'unmarked' ? 'border-amber-500/20' : 'border-stone-100 dark:border-white/5'
                  )}
                >
                  {/* Status Bloom */}
                  <div className={cn(
                    "absolute -top-10 -right-10 w-24 h-24 blur-3xl opacity-10 rounded-full",
                    student.status === AttendanceStatus.PRESENT ? "bg-green-500" :
                      student.status === AttendanceStatus.ABSENT ? "bg-red-500" : "bg-stone-500"
                  )} />

                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="flex-1">
                      <h3 className="font-black text-stone-900 dark:text-stone-100 text-lg leading-tight mb-1">
                        {student.studentName}
                      </h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-500 italic">
                        {student.studentCode || 'Chưa có mã'}
                      </p>
                    </div>
                  </div>

                  {/* Status Selector - Pro Max Touch Buttons */}
                  <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
                    <button
                      onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.PRESENT)}
                      className={cn(
                        "h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all press-effect flex flex-col items-center justify-center gap-1 shadow-sm",
                        student.status === AttendanceStatus.PRESENT
                          ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 border-none'
                          : 'bg-green-500/5 text-green-600 dark:text-green-400 border border-green-500/10'
                      )}
                    >
                      <span className="text-xl">✅</span>
                      Có mặt
                    </button>
                    <button
                      onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.ABSENT)}
                      className={cn(
                        "h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all press-effect flex flex-col items-center justify-center gap-1 shadow-sm",
                        student.status === AttendanceStatus.ABSENT
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 border-none'
                          : 'bg-red-500/5 text-red-600 dark:text-red-400 border border-red-500/10'
                      )}
                    >
                      <span className="text-xl">❌</span>
                      Vắng mặt
                    </button>
                    <button
                      onClick={() => updateStudentStatus(student.studentId, 'unmarked')}
                      className={cn(
                        "h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all press-effect flex flex-col items-center justify-center gap-1 shadow-sm",
                        student.status === 'unmarked'
                          ? 'bg-stone-600 text-white shadow-lg shadow-stone-600/30 border-none'
                          : 'bg-stone-500/5 text-stone-500 dark:text-stone-400 border border-stone-500/10'
                      )}
                    >
                      <span className="text-xl opacity-40">➖</span>
                      Chưa
                    </button>
                  </div>

                  {/* Remarks - Premium Input Styling */}
                  <div className="relative group z-10">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <input
                      type="text"
                      value={student.remarks || ''}
                      placeholder="Thêm ghi chú riêng..."
                      onChange={(e) => {
                        const newVal = e.target.value;
                        setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, remarks: newVal } : s))
                        setHasUnsavedChanges(true)
                      }}
                      className="w-full text-[13px] bg-stone-500/5 dark:bg-white/5 border border-stone-100 dark:border-white/5 rounded-2xl pl-11 pr-4 py-4 focus:bg-stone-500/10 focus:border-amber-500/40 focus:outline-none transition-all placeholder:text-stone-400 font-bold"
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
                          <span className="text-[8px] text-gray-300 ml-1">#{idx + 1}</span>
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
                            setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, remarks: newVal } : s))
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

      {/* Sticky Mobile Save Button / Desktop Save Section - Pro Max Floating Control */}
      {students.length > 0 && (
        <div className="fixed md:relative bottom-6 md:bottom-auto left-6 right-6 md:left-auto md:right-auto z-[100] md:z-0">
          <div className="max-w-xl mx-auto glass-premium rounded-[28px] p-2 md:p-0 shadow-2xl md:shadow-none border border-white/20 dark:border-white/5 flex gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 md:hidden h-14 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] press-effect transition-all"
            >
              Hủy
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving}
              className="flex-[2] md:flex-none h-14 md:h-12 bg-amber-500 text-white px-10 rounded-2xl hover:bg-amber-600 disabled:bg-stone-300 font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-amber-500/20 transition-all press-effect"
            >
              {saving ? 'Đang lưu...' : 'Xác nhận điểm danh'}
            </button>

            {/* Desktop Cancel Button (Hidden on Mobile inside the pill) */}
            <button
              onClick={() => router.push('/dashboard')}
              className="hidden md:block h-12 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-8 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 font-bold transition-all active:scale-[0.98]"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
