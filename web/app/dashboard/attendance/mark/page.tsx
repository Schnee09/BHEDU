'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  getClasses,
  getClassStudents,
  getAttendance,
  bulkCreateAttendance,
} from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { AcademicBackground } from '@/components/Academic/AcademicBackground';
import { AttendanceStatus, AttendanceRecord } from '@/lib/attendance/types';
import { Button } from '@/components/ui';
import PageGuard from '@/components/PageGuard';

// Types
interface Class {
  id: string;
  name: string;
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
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  attendanceRate: number;
}

// Helpers
const getStatusFormatted = (status: string) => {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Có mặt' };
    case AttendanceStatus.ABSENT:
      return { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Vắng' };
    default:
      return { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Chưa điểm danh' };
  }
};

export default function AttendanceMarkingPage() {
  return (
    <PageGuard permissions="attendance.mark">
      <AttendanceMarkingPageContent />
    </PageGuard>
  );
}

function AttendanceMarkingPageContent() {
  const router = useRouter();

  // Selection State
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0] ?? '');

  // Data State
  const [students, setStudents] = useState<StudentAttendanceView[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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
    loadClasses();
  }, []);

  // Load attendance when class or date changes
  useEffect(() => {
    if (selectedClass && date) {
      loadAttendance();
    }
  }, [selectedClass, date]);

  const loadClasses = async () => {
    try {
      // Fetch classes (defaults to my-classes for teachers if backend handles context,
      // or we can use specific endpoint if needed, but getClasses is V2 standard)
      // We pass pageSize: 100 to get a good list.
      const res = await getClasses({ limit: 100 });
      const classList = (res.data || []) as any[];
      setClasses(classList.map((c) => ({ id: c.id, name: c.name })));

      if (classList.length > 0) {
        setSelectedClass(classList[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes', error);
      setClasses([]);
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        getClassStudents(selectedClass),
        getAttendance({ class_id: selectedClass, date: date, limit: 1000 }),
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
          recordId: record?.id,
        };
      });

      setStudents(mappedStudents);
      calculateSummary(mappedStudents);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load attendance', error);
      alert('Không thể tải dữ liệu điểm danh');
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (currentStudents: StudentAttendanceView[]) => {
    const total = currentStudents.length;
    const present = currentStudents.filter((s) => s.status === AttendanceStatus.PRESENT).length;
    const absent = currentStudents.filter((s) => s.status === AttendanceStatus.ABSENT).length;
    const unmarked = currentStudents.filter((s) => s.status === 'unmarked').length;

    const denominator = present + absent;
    const rate = denominator > 0 ? Math.round((present / denominator) * 100) : 0;

    setSummary({
      totalStudents: total,
      presentCount: present,
      absentCount: absent,
      unmarkedCount: unmarked,
      attendanceRate: rate,
    });
  };

  const updateStudentStatus = (studentId: string, status: string) => {
    setStudents((prev) => {
      const updated = prev.map((student) =>
        student.studentId === studentId ? { ...student, status: status as any } : student
      );
      calculateSummary(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents((prev) => {
      const updated = prev.map((student) => ({ ...student, status }));
      calculateSummary(updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      // Filter out unmarked if we don't want to save them
      const recordsToSave = students
        .filter((s) => s.status !== 'unmarked')
        .map((student) => ({
          student_id: student.studentId,
          status: student.status,
          notes: student.remarks,
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
        records: recordsToSave,
      });

      setShowSuccess(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setShowSuccess(false), 3000);
      loadAttendance(); // Reload to refresh/sync IDs
    } catch (error) {
      console.error('Failed to save attendance', error);
      alert('Không thể lưu điểm danh');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-stone-50 dark:bg-[#080808] font-Be_Vietnam_Pro selection:bg-red-600/30 text-stone-900 dark:text-stone-100 p-4 md:p-12 lg:p-16">
      <AcademicBackground />

      <div className="max-w-[1400px] mx-auto relative z-10 space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-stone-200 dark:border-stone-800 pb-10">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight uppercase">
              Điểm danh <span className="text-red-600">sinh viên</span>
            </h1>
            <p className="text-stone-500 font-mono text-xs tracking-widest uppercase flex items-center gap-2">
              ATTENDANCE • CLASS MANAGEMENT
            </p>
          </div>
          <div className="flex flex-col items-end gap-4 max-w-md w-full">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Lớp học
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full h-10 bg-white dark:bg-white/5 border border-stone-200 dark:border-stone-800 rounded-sharp px-3 text-xs font-bold uppercase tracking-wider focus:border-red-600/50 outline-none transition-all appearance-none"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Ngày
                </label>
                <input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 bg-white dark:bg-white/5 border border-stone-200 dark:border-stone-800 rounded-sharp px-3 text-xs font-bold uppercase tracking-wider focus:border-red-600/50 outline-none transition-all appearance-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary with Progress */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Tổng số', value: summary.totalStudents, color: 'stone' },
              { label: 'Có mặt', value: summary.presentCount, color: 'green' },
              { label: 'Vắng', value: summary.absentCount, color: 'red' },
              { label: 'Chưa đánh dấu', value: summary.unmarkedCount, color: 'stone' },
              { label: 'Tỷ lệ', value: `${summary.attendanceRate}%`, color: 'red' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white/50 dark:bg-stone-900/50 p-6 rounded-sharp border border-stone-200 dark:border-stone-800 backdrop-blur-sm border-l-4 border-l-stone-200 dark:border-l-stone-800 hover:border-l-red-600 transition-all duration-300"
              >
                <div className="text-2xl font-bold tracking-tight mb-1">{stat.value}</div>
                <div className="text-[9px] font-bold text-stone-500 uppercase tracking-[0.2em]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        {students.length > 0 && (
          <div className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200 dark:border-stone-800 p-4 rounded-sharp flex flex-wrap items-center justify-between gap-4 sticky top-4 z-20 shadow-xl shadow-stone-900/5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mr-2">
                Đánh dấu nhanh:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll(AttendanceStatus.PRESENT)}
                className="rounded-sharp border-stone-200 text-green-600 hover:bg-green-50 uppercase text-[10px] font-bold tracking-widest h-8"
              >
                ✅ Tất cả có mặt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll(AttendanceStatus.ABSENT)}
                className="rounded-sharp border-stone-200 text-red-600 hover:bg-red-50 uppercase text-[10px] font-bold tracking-widest h-8"
              >
                ❌ Tất cả vắng
              </Button>
            </div>

            <div className="flex items-center gap-4">
              {hasUnsavedChanges && (
                <span className="text-[10px] font-bold text-red-600 animate-pulse italic uppercase tracking-widest">
                  Chưa lưu thay đổi •
                </span>
              )}
              <Button
                onClick={saveAttendance}
                disabled={saving}
                className="rounded-sharp bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-[0.2em] text-[10px] h-9 px-8 shadow-lg shadow-red-600/20"
              >
                {saving ? 'Đang đồng bộ...' : 'Lưu dữ liệu'}
              </Button>
            </div>
          </div>
        )}

        {/* Student List */}
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-sharp" />
            <span className="text-xs font-bold tracking-widest uppercase text-stone-400">
              Đang tải danh sách...
            </span>
          </div>
        ) : students.length === 0 ? (
          <div className="py-24 bg-white/30 rounded-sharp border-2 border-dashed border-stone-200 dark:border-stone-800 text-center">
            <span className="text-sm font-medium text-stone-500 italic">
              Chọn lớp để bắt đầu điểm danh.
            </span>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900/50 rounded-sharp border border-stone-200 dark:border-stone-800 overflow-hidden shadow-2xl">
            <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-800">
              <thead>
                <tr className="bg-stone-50/50 dark:bg-stone-800/50">
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                    Sinh viên
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                    Trạng thái
                  </th>
                  <th className="px-8 py-5 text-left text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">
                    Ghi chú
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {students.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-stone-50/50 dark:hover:bg-red-600/5 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-sharp bg-stone-100 dark:bg-stone-800 flex items-center justify-center font-bold text-stone-400 group-hover:bg-red-600 group-hover:text-white transition-all">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                            {student.studentName}
                          </div>
                          <div className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mt-0.5">
                            {student.studentCode || 'BH-STUDENT'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2">
                        {[
                          {
                            val: AttendanceStatus.PRESENT,
                            icon: '✅',
                            label: 'Có mặt',
                            color: 'green',
                          },
                          { val: AttendanceStatus.ABSENT, icon: '❌', label: 'Vắng', color: 'red' },
                          { val: 'unmarked', icon: '➖', label: 'Chưa đánh', color: 'stone' },
                        ].map((opt) => {
                          const colorMap: Record<string, string> = {
                            green: 'bg-green-600 shadow-green-500/20',
                            red: 'bg-red-600 shadow-red-500/20',
                            stone: 'bg-stone-600 shadow-stone-500/20',
                          };
                          const currentColor =
                            colorMap[opt.color] || 'bg-stone-600 shadow-stone-500/20';
                          return (
                            <button
                              key={opt.val}
                              onClick={() => updateStudentStatus(student.studentId, opt.val)}
                              className={cn(
                                'h-9 px-4 rounded-sharp text-[9px] font-bold uppercase tracking-widest transition-all border',
                                student.status === opt.val
                                  ? `${currentColor} border-transparent text-white shadow-lg`
                                  : 'bg-white dark:bg-white/5 border-stone-200 dark:border-stone-800 text-stone-400 hover:border-red-600/30'
                              )}
                            >
                              {opt.icon} {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <input
                        type="text"
                        value={student.remarks || ''}
                        placeholder="Thêm ghi chú..."
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setStudents((prev) =>
                            prev.map((s) =>
                              s.studentId === student.studentId ? { ...s, remarks: newVal } : s
                            )
                          );
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full bg-transparent border-b border-stone-200 dark:border-stone-800 py-1 text-xs focus:border-red-600 outline-none transition-all placeholder:italic placeholder:text-stone-300"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard')}
            className="font-bold text-xs uppercase tracking-widest text-stone-400 hover:text-red-600"
          >
            ← Quay lại bảng điều khiển
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .rounded-sharp {
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
