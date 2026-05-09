/**
 * Enrollment Manager Component
 * Refactored with premium stone/amber theme and Vietnamese localization
 */

'use client';

import { useState, useEffect } from 'react';
import { apiFetch, enrollStudent, deleteEnrollment } from '@/lib/api/client';
import { showToast } from '@/components/ToastProvider';
import { Icons } from '@/components/ui/Icons';
import { useTranslation } from '@/contexts/I18nContext';
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
import { Button, Card, Badge } from '@/components/ui';

interface Class {
  id: string;
  name: string;
  code: string;
  schedule?: string;
  teacher_name?: string;
  capacity?: number;
  enrollment_count?: number;
  course_code?: string;
  course?: { id: string; code: string; name: string };
  class_type?: 'group' | 'tutoring';
  sessions_per_week?: number;
}

interface Enrollment {
  id: string;
  class_id: string;
  class_name: string;
  class_code: string;
  schedule?: string;
  teacher_name?: string;
  enrollment_date: string;
  status: string;
}

interface EnrollmentManagerProps {
  studentId: string;
}

export default function EnrollmentManager({ studentId }: EnrollmentManagerProps) {
  const { t } = useTranslation();
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

        setEnrollments(enrollmentsData.enrollments || []);

        // Filter out classes the student is already enrolled in
        const enrolledClassIds = new Set(
          enrollmentsData.enrollments?.map((e: Enrollment) => e.class_id) || []
        );
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
      // Check for conflicts only with active enrollments
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

  const hasTimeOverlap = (schedule1: string, schedule2: string): boolean => {
    const days1 = schedule1.split(' ')[0]?.toLowerCase() || '';
    const days2 = schedule2.split(' ')[0]?.toLowerCase() || '';

    const dayAbbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const hasDayOverlap = dayAbbrevs.some((day) => days1.includes(day) && days2.includes(day));

    if (!hasDayOverlap) return false;

    const time1 = schedule1.split(' ')[1];
    const time2 = schedule2.split(' ')[1];
    if (!time1 || !time2) return false;

    const [start1, end1] = time1.split('-');
    const [start2, end2] = time2.split('-');
    if (!start1 || !end1 || !start2 || !end2) return false;

    const toMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return (hours || 0) * 60 + (minutes || 0);
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

    // Check conflicts
    const conflicts = checkScheduleConflict(selectedClass?.schedule);
    setScheduleConflicts(conflicts);

    // Check capacity (synchronized with API property names)
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

    // If there are warnings, show dialog instead of proceeding directly
    if (scheduleConflicts.length > 0 || capacityWarning) {
      setShowWarningDialog(true);
      return;
    }

    await performEnrollment();
  };

  const performEnrollment = async () => {
    const toastId = showToast.loading('Đang thực hiện ghi danh...');
    setProcessingEnrollment(selectedClassId);
    setShowWarningDialog(false);

    try {
      // enrollStudent uses the internal client which now defaults to 'active' status
      await enrollStudent(studentId, selectedClassId);

      showToast.dismiss(toastId);
      showToast.success('Ghi danh học viên thành công!');
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
      showToast.success('Đã hủy ghi danh thành công');
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
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
          Đang tải dữ liệu lớp học...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Add Enrollment Section */}
      <div className="grid grid-cols-1 gap-8">
        <div className="flex items-center justify-between pb-6 border-b border-stone-100 dark:border-white/5">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Icons.Classes className="w-6 h-6 text-amber-500" /> Quản lý Ghi danh
            </h2>
            <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest">
              Ghi danh học viên vào các lớp học đang hoạt động.
            </p>
          </div>
          {!showAddDropdown && (
            <Button
              onClick={() => setShowAddDropdown(true)}
              className="font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-2xl shadow-amber-glow"
            >
              <Icons.Add className="w-3.5 h-3.5 mr-2" /> Ghi danh Lớp mới
            </Button>
          )}
        </div>

        {showAddDropdown && (
          <div className="rounded-[2rem] bg-stone-50/50 dark:bg-white/[0.02] border border-stone-100 dark:border-white/5 p-10 animate-in slide-in-from-top-4 duration-500">
            <div className="max-w-xl space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  Chọn Lớp học khả dụng
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassSelect(e.target.value)}
                  className="w-full h-14 bg-white dark:bg-stone-950 rounded-2xl border-stone-200 dark:border-white/10 px-6 font-bold text-stone-900 dark:text-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm"
                  disabled={processingEnrollment !== null}
                >
                  <option value="">-- Chọn lớp học từ danh sách --</option>
                  {availableClasses.map((cls) => {
                    const maxCap = cls.capacity ?? 12;
                    const enrolled = cls.enrollment_count ?? 0;
                    const isFull = enrolled >= maxCap;
                    return (
                      <option key={cls.id} value={cls.id} className="py-2">
                        {cls.code || cls.course_code || cls.course?.code || 'N/A'} - {cls.name}{' '}
                        {cls.schedule && ` | ${cls.schedule}`} ({enrolled}/{maxCap}){' '}
                        {isFull ? '[LỚP ĐÃ ĐẦY]' : ''}
                      </option>
                    );
                  })}
                </select>
                {availableClasses.length === 0 && (
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl">
                    Hiện không có lớp học nào khả dụng để ghi danh.
                  </p>
                )}
              </div>

              {/* Inline Warnings */}
              <div className="space-y-4">
                {scheduleConflicts.length > 0 && (
                  <div className="flex items-start gap-4 rounded-[1.5rem] bg-amber-50 border border-amber-100 p-6 dark:bg-amber-900/10 dark:border-amber-500/20">
                    <Icons.Warning className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest mb-1">
                        Cảnh báo Trùng lịch học
                      </p>
                      <ul className="text-[11px] text-amber-700 dark:text-amber-500 space-y-1 font-medium">
                        {scheduleConflicts.map((c, i) => (
                          <li key={i}>• Trùng với: {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {capacityWarning && (
                  <div className="flex items-start gap-4 rounded-[1.5rem] bg-orange-50 border border-orange-100 p-6 dark:bg-orange-900/10 dark:border-orange-500/20">
                    <Icons.Warning className="w-6 h-6 text-orange-500 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-orange-900 dark:text-orange-400 uppercase tracking-widest mb-1">
                        Cảnh báo Sĩ số lớp
                      </p>
                      <p className="text-[11px] text-orange-700 dark:text-orange-500 font-medium">
                        Lớp đã đạt sĩ số tối đa ({capacityWarning.enrolled}/{capacityWarning.max}).
                        Cần xác nhận trước khi tiếp tục.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddEnrollment}
                  disabled={!selectedClassId || processingEnrollment !== null}
                  isLoading={processingEnrollment === selectedClassId}
                  className="font-black uppercase tracking-widest text-[11px] h-14 px-10 rounded-2xl shadow-amber-glow"
                >
                  Xác nhận Ghi danh
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
                  className="font-black uppercase tracking-widest text-[11px] h-14 px-8 rounded-2xl border-stone-200"
                >
                  Hủy bỏ
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Current Enrollments */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
            Danh sách Lớp đã ghi danh ({enrollments.length})
          </h3>
        </div>

        {enrollments.length === 0 ? (
          <Card
            borderStyle="dashed"
            className="p-16 text-center rounded-[2.5rem] bg-stone-50/50 dark:bg-white/[0.01]"
          >
            <div className="w-16 h-16 bg-stone-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icons.Classes className="w-8 h-8 text-stone-300" />
            </div>
            <p className="text-stone-500 font-medium mb-2">Học sinh chưa tham gia lớp học nào.</p>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic">
              Nhấn vào nút "Ghi danh Lớp mới" để bắt đầu.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="group flex flex-col md:flex-row items-start md:items-center justify-between p-6 bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 rounded-[2rem] hover:shadow-xl hover:border-amber-500/20 transition-all duration-500"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge
                      variant="secondary"
                      className="bg-stone-50 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-black text-[10px] uppercase tracking-widest px-3 h-8"
                    >
                      {enrollment.class_code}
                    </Badge>
                    <h4 className="font-serif font-black text-lg text-stone-900 dark:text-white uppercase tracking-tight">
                      {enrollment.class_name}
                    </h4>
                    {enrollment.status === 'enrolled' || enrollment.status === 'active' ? (
                      <Badge
                        variant="success"
                        className="font-black text-[8px] uppercase tracking-widest px-2 h-5"
                      >
                        Đang học
                      </Badge>
                    ) : enrollment.status === 'dropped' ? (
                      <Badge
                        variant="secondary"
                        className="font-black text-[8px] uppercase tracking-widest px-2 h-5"
                      >
                        Nghỉ học
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="font-black text-[8px] uppercase tracking-widest px-2 h-5"
                      >
                        {enrollment.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[11px] font-black text-stone-400 uppercase tracking-widest">
                    {enrollment.schedule && (
                      <span className="flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4 text-amber-500" /> {enrollment.schedule}
                      </span>
                    )}
                    {enrollment.teacher_name && (
                      <span className="flex items-center gap-2">
                        <Icons.User className="w-4 h-4 text-amber-500" /> {enrollment.teacher_name}
                      </span>
                    )}
                    <span className="flex items-center gap-2">
                      <Icons.History className="w-4 h-4 text-stone-300" /> Ngày ghi danh:{' '}
                      {new Date(enrollment.enrollment_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>

                {(enrollment.status === 'enrolled' || enrollment.status === 'active') && (
                  <Button
                    variant="ghost"
                    onClick={() => handleRemoveClick(enrollment.id, enrollment.class_name)}
                    disabled={processingEnrollment === enrollment.id}
                    className="mt-6 md:mt-0 font-black uppercase tracking-widest text-[9px] h-10 text-red-500 hover:bg-red-500/10 rounded-xl"
                  >
                    {processingEnrollment === enrollment.id ? 'Đang xử lý...' : 'Hủy ghi danh'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warning Dialog (Capacity + Schedule) */}
      <AlertDialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <AlertDialogContent className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-white/5 p-10 max-w-xl shadow-ultra">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Icons.Warning className="w-8 h-8 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight mb-4">
              Xác nhận ghi danh đặc biệt
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500 font-medium leading-relaxed mb-6">
              Hệ thống phát hiện các xung đột sau đây, bạn có chắc chắn muốn tiếp tục ghi danh
              không?
              <div className="mt-6 space-y-3">
                {scheduleConflicts.map((conflict, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-500"
                  >
                    <span className="shrink-0">•</span>{' '}
                    <span>Xung đột lịch học với: {conflict}</span>
                  </div>
                ))}
                {capacityWarning && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-500/20 text-xs font-bold text-orange-700 dark:text-orange-500">
                    <span className="shrink-0">•</span>{' '}
                    <span>
                      Sĩ số lớp đã đạt tối đa ({capacityWarning.enrolled}/{capacityWarning.max})
                    </span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-4">
            <AlertDialogCancel
              disabled={processingEnrollment !== null}
              className="flex-1 font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl border-stone-200"
            >
              Kiểm tra lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performEnrollment}
              className="flex-1 font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-amber-glow"
            >
              Vẫn ghi danh
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-white/5 p-10 max-w-md shadow-ultra">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Icons.Archive className="w-8 h-8 text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-serif font-black text-stone-900 dark:text-white uppercase tracking-tight mb-4 text-red-600">
              Hủy ghi danh lớp học?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-stone-500 font-medium leading-relaxed mb-8">
              Bạn có chắc chắn muốn hủy ghi danh học sinh khỏi lớp{' '}
              <span className="font-bold text-stone-900 dark:text-white">
                {enrollmentToRemove?.name}
              </span>
              ? Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-4">
            <AlertDialogCancel
              disabled={processingEnrollment !== null}
              className="flex-1 font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl border-stone-200"
            >
              Giữ lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performRemoval}
              className="flex-1 font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl bg-red-600 hover:bg-red-700 shadow-lg"
            >
              Xác nhận hủy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
