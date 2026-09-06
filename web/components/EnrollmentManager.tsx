/**
 * Enrollment Manager Component
 * Refactored with premium Stone/Amber design system, mobile-first responsive layout, and Vietnamese localization.
 */

'use client';

import { useState, useEffect } from 'react';
import { apiFetch, enrollStudent, deleteEnrollment } from '@/lib/api/client';
import { showToast } from '@/components/ToastProvider';
import { Icons } from '@/components/ui/Icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button, Badge } from '@/components/ui';
import {
  PlusIcon,
  CalendarDaysIcon,
  UserIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ClockIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Class {
  id: string;
  name: string;
  code?: string;
  schedule?: string;
  teacher_name?: string;
  capacity?: number;
  enrollment_count?: number;
  course_code?: string;
  class_type?: 'group' | 'tutoring';
  sessions_per_week?: number;
}

interface Enrollment {
  id: string;
  class_id: string;
  class_name: string;
  class_code?: string;
  schedule?: string;
  teacher_name?: string;
  enrollment_date: string;
  status: string;
}

interface EnrollmentManagerProps {
  studentId: string;
  onEnrollmentCountChange?: (count: number) => void;
}

export default function EnrollmentManager({
  studentId,
  onEnrollmentCountChange,
}: EnrollmentManagerProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableClasses, setAvailableClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [scheduleConflicts, setScheduleConflicts] = useState<string[]>([]);
  const [processingEnrollment, setProcessingEnrollment] = useState<string | null>(null);

  // Dialog states
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [enrollmentToRemove, setEnrollmentToRemove] = useState<{ id: string; name: string } | null>(
    null
  );
  const [capacityWarning, setCapacityWarning] = useState<{ enrolled: number; max: number } | null>(
    null
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [enrollmentsRes, classesRes] = await Promise.all([
        apiFetch(`/api/admin/students/${studentId}/enrollments`),
        apiFetch('/api/admin/classes?status=active'),
      ]);

      if (enrollmentsRes.ok && classesRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        const classesData = await classesRes.json();

        const enrs = enrollmentsData.enrollments || [];
        setEnrollments(enrs);
        if (onEnrollmentCountChange) {
          onEnrollmentCountChange(enrs.length);
        }

        // Filter out classes the student is already enrolled in
        const enrolledClassIds = new Set(enrs.map((e: Enrollment) => e.class_id));
        const available =
          classesData.classes?.filter((c: Class) => !enrolledClassIds.has(c.id)) || [];
        setAvailableClasses(available);
      }
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
      showToast.error('Không thể tải thông tin ghi danh');
    } finally {
      setLoading(false);
    }
  };

  const checkScheduleConflict = (newSchedule?: string) => {
    if (!newSchedule) return [];

    const conflicts: string[] = [];
    enrollments.forEach((enrollment) => {
      if (
        (enrollment.status === 'enrolled' || enrollment.status === 'active') &&
        enrollment.schedule &&
        hasTimeOverlap(enrollment.schedule, newSchedule)
      ) {
        conflicts.push(`${enrollment.class_name} (${enrollment.schedule})`);
      }
    });

    return conflicts;
  };

  const hasTimeOverlap = (sched1: string, sched2: string): boolean => {
    const daysMap: Record<string, number> = { T2: 2, T3: 3, T4: 4, T5: 5, T6: 6, T7: 7, CN: 8 };

    const getDays = (s: string) => {
      const days: number[] = [];
      Object.entries(daysMap).forEach(([key, val]) => {
        if (s.includes(key)) days.push(val);
      });
      return days;
    };

    const days1 = getDays(sched1);
    const days2 = getDays(sched2);

    const hasCommonDay = days1.some((d) => days2.includes(d));
    if (!hasCommonDay) return false;

    const timeRegex = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
    const m1 = sched1.match(timeRegex);
    const m2 = sched2.match(timeRegex);

    if (!m1 || !m2 || !m1[1] || !m1[2] || !m2[1] || !m2[2]) return false;

    const start1 = m1[1];
    const end1 = m1[2];
    const start2 = m2[1];
    const end2 = m2[2];

    const toMinutes = (timeStr: string) => {
      const parts = timeStr.split(':');
      const h = Number(parts[0] || 0);
      const m = Number(parts[1] || 0);
      return h * 60 + m;
    };

    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);

    return s1 < e2 && s2 < e1;
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    const selectedClass = availableClasses.find((c) => c.id === classId);

    const conflicts = checkScheduleConflict(selectedClass?.schedule);
    setScheduleConflicts(conflicts);

    const maxCapacity = selectedClass?.capacity ?? 12;
    const currentEnrolled = selectedClass?.enrollment_count ?? 0;
    if (currentEnrolled >= maxCapacity) {
      setCapacityWarning({ enrolled: currentEnrolled, max: maxCapacity });
    } else {
      setCapacityWarning(null);
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedClassId) {
      showToast.error('Vui lòng chọn một lớp học');
      return;
    }

    if (scheduleConflicts.length > 0 || capacityWarning) {
      setShowWarningDialog(true);
      return;
    }

    await performEnrollment();
  };

  const performEnrollment = async () => {
    const toastId = showToast.loading('Đang ghi danh học sinh...');
    setProcessingEnrollment(selectedClassId);
    setShowWarningDialog(false);

    try {
      await enrollStudent(studentId, selectedClassId);

      showToast.dismiss(toastId);
      showToast.success('Ghi danh học sinh vào lớp thành công!');
      setSelectedClassId('');
      setScheduleConflicts([]);
      setCapacityWarning(null);
      setShowAddDropdown(false);
      await fetchData();
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Đã có lỗi xảy ra';
      console.error('Error enrolling student:', error);
      showToast.dismiss(toastId);
      showToast.error(errMessage);
    } finally {
      setProcessingEnrollment(null);
    }
  };

  const handleRemoveClick = (enrollmentId: string, className: string) => {
    setEnrollmentToRemove({ id: enrollmentId, name: className });
    setShowRemoveDialog(true);
  };

  const performRemoval = async () => {
    if (!enrollmentToRemove) return;

    const toastId = showToast.loading('Đang hủy ghi danh...');
    setProcessingEnrollment(enrollmentToRemove.id);
    setShowRemoveDialog(false);

    try {
      await deleteEnrollment(enrollmentToRemove.id);

      showToast.dismiss(toastId);
      showToast.success('Đã hủy ghi danh lớp học');
      await fetchData();
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Không thể hủy ghi danh';
      console.error('Error removing enrollment:', error);
      showToast.dismiss(toastId);
      showToast.error(errMessage);
    } finally {
      setProcessingEnrollment(null);
      setEnrollmentToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-3">
        <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-stone-400">Đang tải danh sách lớp học...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Icons.Classes className="w-4 h-4" />
            </span>
            Lớp học đang tham gia ({enrollments.length})
          </h2>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Quản lý các lớp học chính khóa, ca dạy và giáo viên phụ trách
          </p>
        </div>

        {!showAddDropdown && (
          <Button
            onClick={() => setShowAddDropdown(true)}
            className="h-9 px-4 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-sm gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4 stroke-[2.5]" />
            <span>Ghi danh lớp mới</span>
          </Button>
        )}
      </div>

      {/* Add Enrollment Dropdown / Card */}
      {showAddDropdown && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-800 dark:text-stone-200 uppercase tracking-wider block">
              Chọn lớp học để ghi danh
            </label>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              Hệ thống sẽ tự động kiểm tra trùng lịch và sĩ số tối đa của lớp học.
            </p>
          </div>

          <div className="max-w-xl space-y-3">
            <select
              value={selectedClassId}
              onChange={(e) => handleClassSelect(e.target.value)}
              className="w-full h-11 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 px-3.5 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-xs"
              disabled={processingEnrollment !== null}
            >
              <option value="">-- Chọn lớp học từ danh sách --</option>
              {availableClasses.map((cls) => {
                const maxCap = cls.capacity ?? 12;
                const enrolled = cls.enrollment_count ?? 0;
                const isFull = enrolled >= maxCap;
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} {cls.schedule ? `| ${cls.schedule}` : ''} ({enrolled}/{maxCap}){' '}
                    {isFull ? '[LỚP ĐÃ ĐẦY]' : ''}
                  </option>
                );
              })}
            </select>

            {availableClasses.length === 0 && (
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-200/60">
                Hiện không có lớp học nào khả dụng để ghi danh thêm.
              </p>
            )}

            {/* Inline Warnings */}
            {scheduleConflicts.length > 0 && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-300">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Cảnh báo trùng ca học:</strong>
                  <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px]">
                    {scheduleConflicts.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {capacityWarning && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-medium text-rose-800 dark:text-rose-300">
                <ExclamationTriangleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Lớp đã đạt sĩ số tối đa:</strong>
                  <span className="text-[11px]">
                    Hiện có {capacityWarning.enrolled}/{capacityWarning.max} học sinh trong lớp.
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                onClick={handleAddEnrollment}
                disabled={!selectedClassId || processingEnrollment !== null}
                isLoading={processingEnrollment === selectedClassId}
                className="h-9 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 cursor-pointer shadow-xs"
              >
                Xác nhận ghi danh
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDropdown(false);
                  setSelectedClassId('');
                  setScheduleConflicts([]);
                  setCapacityWarning(null);
                }}
                disabled={processingEnrollment !== null}
                className="h-9 px-4 rounded-xl font-bold text-xs border-stone-200 dark:border-stone-800"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled Classes List */}
      {enrollments.length === 0 ? (
        <div className="p-8 sm:p-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-white/10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-white/5 text-stone-400 flex items-center justify-center mx-auto mb-2">
            <AcademicCapIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-stone-800 dark:text-stone-200">
            Chưa tham gia lớp học nào
          </p>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Học sinh này hiện chưa được xếp vào lớp học. Nhấn &quot;Ghi danh lớp mới&quot; ở trên để
            bắt đầu xếp lớp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="p-4 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/10 rounded-2xl shadow-xs hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-white truncate">
                      {enrollment.class_name}
                    </h3>
                    {enrollment.class_code && (
                      <span className="text-[10px] font-mono font-bold text-stone-400 block mt-0.5">
                        Mã: {enrollment.class_code}
                      </span>
                    )}
                  </div>
                  <Badge
                    variant={
                      enrollment.status === 'enrolled' || enrollment.status === 'active'
                        ? 'success'
                        : 'default'
                    }
                    className="text-[9px] font-black uppercase px-2 py-0.5 shrink-0"
                  >
                    {enrollment.status === 'enrolled' || enrollment.status === 'active'
                      ? 'Đang học'
                      : enrollment.status === 'dropped'
                        ? 'Nghỉ học'
                        : enrollment.status}
                  </Badge>
                </div>

                <div className="space-y-1 pt-2 border-t border-stone-100 dark:border-white/5 text-xs text-stone-600 dark:text-stone-400">
                  {enrollment.schedule && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <ClockIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="font-medium truncate">{enrollment.schedule}</span>
                    </div>
                  )}
                  {enrollment.teacher_name && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <UserIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-medium truncate">GV: {enrollment.teacher_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                    <CalendarDaysIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>
                      Ghi danh:{' '}
                      {enrollment.enrollment_date
                        ? new Date(enrollment.enrollment_date).toLocaleDateString('vi-VN')
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {(enrollment.status === 'enrolled' || enrollment.status === 'active') && (
                <div className="pt-2 border-t border-stone-100 dark:border-white/5 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveClick(enrollment.id, enrollment.class_name)}
                    disabled={processingEnrollment === enrollment.id}
                    className="h-8 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-bold text-[11px] gap-1 cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Hủy ghi danh</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Warning Dialog */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 max-w-md">
          <AlertDialogHeader>
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
              <Icons.Warning className="w-5 h-5 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">
              Xác nhận ghi danh đặc biệt
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-stone-500 leading-relaxed space-y-2">
              <span>Hệ thống phát hiện các cảnh báo sau, bạn có chắc chắn muốn tiếp tục?</span>
              {scheduleConflicts.map((conflict, idx) => (
                <span
                  key={idx}
                  className="block p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl text-amber-800 dark:text-amber-300 font-semibold"
                >
                  • Trùng lịch: {conflict}
                </span>
              ))}
              {capacityWarning && (
                <span className="block p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-800 dark:text-rose-300 font-semibold">
                  • Lớp đã đạt tối đa ({capacityWarning.enrolled}/{capacityWarning.max} học sinh)
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 pt-2">
            <AlertDialogCancel
              disabled={processingEnrollment !== null}
              className="flex-1 font-bold text-xs h-10 rounded-xl"
            >
              Kiểm tra lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performEnrollment}
              className="flex-1 font-bold text-xs h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950"
            >
              Vẫn ghi danh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 max-w-sm">
          <AlertDialogHeader>
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center mb-3">
              <TrashIcon className="w-5 h-5 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight text-rose-600">
              Hủy ghi danh lớp học?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-stone-500 leading-relaxed">
              Bạn có chắc chắn muốn hủy ghi danh học sinh khỏi lớp{' '}
              <strong className="text-stone-900 dark:text-white">{enrollmentToRemove?.name}</strong>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 pt-2">
            <AlertDialogCancel
              disabled={processingEnrollment !== null}
              className="flex-1 font-bold text-xs h-10 rounded-xl"
            >
              Giữ lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performRemoval}
              className="flex-1 font-bold text-xs h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
