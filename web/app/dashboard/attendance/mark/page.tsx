'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/contexts/I18nContext';
import {
  getClasses,
  getClassAttendance,
  searchAttendanceCandidates,
  bulkCreateAttendance,
  type AttendanceCandidate,
} from '@/lib/api/client';
import { AttendanceStatus } from '@/lib/attendance/types';
import { Button, LoadingState } from '@/components/ui';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import PageGuard from '@/components/PageGuard';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ClipboardDocumentCheckIcon,
  Squares2X2Icon,
  UserGroupIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserPlusIcon,
  ClockIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

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
  enrollmentExceptionReason?: string | null;
}

interface AttendanceSummary {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  unmarkedCount: number;
  attendanceRate: number;
}

function getAttendanceSummary(currentStudents: StudentAttendanceView[]): AttendanceSummary {
  const present = currentStudents.filter((s) => s.status === AttendanceStatus.PRESENT).length;
  const absent = currentStudents.filter((s) => s.status === AttendanceStatus.ABSENT).length;
  const late = currentStudents.filter((s) => s.status === AttendanceStatus.LATE).length;
  const excused = currentStudents.filter((s) => s.status === AttendanceStatus.EXCUSED).length;
  const unmarked = currentStudents.filter((s) => s.status === 'unmarked').length;
  const marked = present + absent + late + excused;

  return {
    totalStudents: currentStudents.length,
    presentCount: present,
    absentCount: absent,
    lateCount: late,
    excusedCount: excused,
    unmarkedCount: unmarked,
    attendanceRate: marked > 0 ? Math.round((present / marked) * 100) : 0,
  };
}

export default function AttendanceMarkingPage() {
  return (
    <PageGuard permissions="attendance.mark">
      <Suspense
        fallback={
          <div className="min-h-screen bg-transparent flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg" />
          </div>
        }
      >
        <AttendanceMarkingPageContent />
      </Suspense>
    </PageGuard>
  );
}

function AttendanceMarkingPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get('classId');

  // Selection State
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(initialClassId || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0] ?? '');

  // Data State
  const [students, setStudents] = useState<StudentAttendanceView[]>([]);
  const summary = useMemo(() => getAttendanceSummary(students), [students]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidates, setCandidates] = useState<AttendanceCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<AttendanceCandidate | null>(null);
  const [exceptionType, setExceptionType] = useState<'Học thử' | 'Học bù'>('Học thử');
  const [exceptionDetail, setExceptionDetail] = useState('');
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [candidateSearchAttempted, setCandidateSearchAttempted] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const loadClasses = useCallback(async () => {
    try {
      const res = await getClasses({ limit: 100 });
      const classList = (res.data || []) as any[];
      setClasses(classList.map((c) => ({ id: c.id, name: c.name })));

      if (classList.length > 0) {
        setSelectedClass((current) => current || classList[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes', error);
      setClasses([]);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const attendance = await getClassAttendance(selectedClass, date);
      const mappedStudents: StudentAttendanceView[] = attendance.students.map((student) => ({
        studentId: student.studentId,
        studentName: student.studentName,
        studentCode: student.studentCode,
        email: student.email,
        status: student.status as AttendanceStatus | 'unmarked',
        remarks: student.remarks || '',
        recordId: student.recordId,
        enrollmentExceptionReason: student.enrollmentExceptionReason,
      }));

      setStudents(mappedStudents);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load attendance', error);
      toast.error(t('attendance.mark.table.noStudents'));
    } finally {
      setLoading(false);
    }
  }, [selectedClass, date, t]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (selectedClass && date) void loadAttendance();
  }, [selectedClass, date, loadAttendance]);

  const updateStudentStatus = (studentId: string, status: string) => {
    setStudents((prev) => {
      const updated = prev.map((student) =>
        student.studentId === studentId ? { ...student, status: status as any } : student
      );
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const markAll = (status: AttendanceStatus) => {
    setStudents((prev) => {
      const updated = prev.map((student) => ({ ...student, status }));
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  const saveAttendance = async () => {
    if (
      students.some((student) => student.enrollmentExceptionReason && student.status === 'unmarked')
    ) {
      toast.error('Vui lòng chọn trạng thái điểm danh cho học sinh học thử hoặc học bù');
      return;
    }
    setSaving(true);
    try {
      const recordsToSave = students
        .filter((s) => s.status !== 'unmarked')
        .map((student) => ({
          student_id: student.studentId,
          status: student.status,
          notes: student.remarks,
          enrollment_exception_reason: student.enrollmentExceptionReason || undefined,
        }));

      if (recordsToSave.length === 0) {
        toast.success(t('common.success'));
        setHasUnsavedChanges(false);
        setSaving(false);
        return;
      }

      await bulkCreateAttendance({
        class_id: selectedClass,
        date: date,
        records: recordsToSave,
      });

      toast.success(t('common.success'));
      setHasUnsavedChanges(false);
      loadAttendance();
    } catch (error) {
      console.error('Failed to save attendance', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const findExceptionCandidates = async () => {
    const search = candidateSearch.trim();
    if (search.length < 2) {
      toast.error('Nhập ít nhất 2 ký tự để tìm học sinh');
      return;
    }

    setSearchingCandidates(true);
    setCandidateSearchAttempted(false);
    setSelectedCandidate(null);
    try {
      setCandidates(await searchAttendanceCandidates(selectedClass, date, search));
    } catch (error) {
      console.error('Failed to search attendance candidates', error);
      toast.error('Không thể tìm học sinh lúc này');
    } finally {
      setSearchingCandidates(false);
      setCandidateSearchAttempted(true);
    }
  };

  const addExceptionStudent = () => {
    const detail = exceptionDetail.trim();
    if (!selectedCandidate) {
      toast.error('Vui lòng chọn học sinh');
      return;
    }
    if (detail.length < 3) {
      toast.error('Vui lòng ghi lý do cụ thể');
      return;
    }

    const reason = `${exceptionType}: ${detail}`;
    setStudents((current) => {
      if (current.some((student) => student.studentId === selectedCandidate.id)) return current;
      const updated: StudentAttendanceView[] = [
        ...current,
        {
          studentId: selectedCandidate.id,
          studentName: selectedCandidate.full_name,
          studentCode: selectedCandidate.student_code || '',
          email: selectedCandidate.email || undefined,
          status: 'unmarked',
          remarks: '',
          enrollmentExceptionReason: reason,
        },
      ];
      return updated;
    });
    setHasUnsavedChanges(true);
    setShowExceptionForm(false);
    setCandidateSearch('');
    setCandidates([]);
    setCandidateSearchAttempted(false);
    setSelectedCandidate(null);
    setExceptionDetail('');
    toast.success('Đã thêm học sinh vào buổi điểm danh');
  };

  // Generate & copy Zalo report for class group
  const copyZaloReport = () => {
    const currentClass = classes.find((c) => c.id === selectedClass);
    const className = currentClass?.name || 'Lớp học';
    const total = students.length;
    const presentStudents = students.filter((s) => s.status === AttendanceStatus.PRESENT);
    const absentStudents = students.filter((s) => s.status === AttendanceStatus.ABSENT);
    const lateStudents = students.filter((s) => s.status === AttendanceStatus.LATE);
    const excusedStudents = students.filter((s) => s.status === AttendanceStatus.EXCUSED);
    const unmarkedStudents = students.filter((s) => s.status === 'unmarked');

    const absentNames = absentStudents.map((s) => s.studentName).join(', ');
    const lateNames = lateStudents.map((s) => s.studentName).join(', ');
    const excusedNames = excusedStudents.map((s) => s.studentName).join(', ');

    const dateObj = new Date(date);
    const dateFormatted = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;

    let report = `📢 [TRUNG TÂM GIÁO DỤC BÙI HOÀNG]\n`;
    report += `📋 BÁO CÁO ĐIỂM DANH: ${className.toUpperCase()}\n`;
    report += `📅 Ngày học: ${dateFormatted}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `👥 Sĩ số lớp: ${total} học sinh\n`;
    report += `✅ Có mặt: ${presentStudents.length} học sinh\n`;
    if (absentStudents.length > 0) {
      report += `❌ Vắng mặt (${absentStudents.length}): ${absentNames}\n`;
    }
    if (lateStudents.length > 0) {
      report += `⏰ Đi muộn (${lateStudents.length}): ${lateNames}\n`;
    }
    if (excusedStudents.length > 0) {
      report += `📝 Vắng có phép (${excusedStudents.length}): ${excusedNames}\n`;
    }
    if (unmarkedStudents.length > 0) {
      report += `Chưa điểm danh: ${unmarkedStudents.length} học sinh\n`;
    }
    if (
      absentStudents.length === 0 &&
      lateStudents.length === 0 &&
      excusedStudents.length === 0 &&
      unmarkedStudents.length === 0 &&
      total > 0
    ) {
      report += `🎉 Lớp đi học đầy đủ 100%!\n`;
    }
    report += `━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Kính gửi Quý phụ huynh theo dõi tình hình học tập của các con. Trân trọng!`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(report);
      toast.success('Đã sao chép mẫu báo cáo Zalo!');
    }
  };

  // Filter students based on search query
  const filteredStudents = students.filter((s) => {
    if (!studentSearch.trim()) return true;
    const q = studentSearch.toLowerCase().trim();
    return (
      s.studentName.toLowerCase().includes(q) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-8 pb-32 md:pb-16">
      <div className="max-w-[1600px] mx-auto space-y-3 sm:space-y-4 relative z-10">
        {/* ── ULTRA-COMPACT UNIFIED HEADER ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-3 sm:p-5 shadow-sm space-y-3">
          {/* Row 1: Back + Title + Class & Date Selectors */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => router.push('/dashboard/attendance')}
                className="p-2 sm:p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-stone-600 dark:text-stone-300 transition-all cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                title={t('attendance.mark.backToDashboard')}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-start sm:items-center gap-2 min-w-0">
                <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
                  <ClipboardDocumentCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white uppercase leading-tight sm:leading-none break-words">
                    {t('attendance.mark.title')}
                  </h1>
                </div>
              </div>
            </div>

            {/* Class & Date Fast Selectors */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:w-48">
                <Select
                  value={selectedClass}
                  className="rounded-xl border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-800 h-9 sm:h-10 text-xs font-bold uppercase tracking-tight"
                  onChange={(e: any) => setSelectedClass(e.target.value)}
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1 sm:w-40">
                <Input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-800 h-9 sm:h-10 text-xs font-bold uppercase tracking-tight"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Live Summary Stats Pill Bar (Compact & Mobile-friendly) */}
          {summary && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-1 border-t border-stone-100 dark:border-white/5 text-xs font-black no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <UserGroupIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>
                  {t('attendance.mark.summary.total')}:{' '}
                  <strong className="font-mono text-stone-900 dark:text-white">
                    {summary.totalStudents}
                  </strong>
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {t('attendance.mark.summary.present')}:{' '}
                  <strong className="font-mono text-emerald-800 dark:text-emerald-200">
                    {summary.presentCount}
                  </strong>
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                <XCircleIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {t('attendance.mark.summary.absent')}:{' '}
                  <strong className="font-mono text-rose-800 dark:text-rose-200">
                    {summary.absentCount}
                  </strong>
                </span>
              </div>
              {summary.lateCount > 0 && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>
                    Đi muộn:{' '}
                    <strong className="font-mono text-amber-800 dark:text-amber-200">
                      {summary.lateCount}
                    </strong>
                  </span>
                </div>
              )}
              {summary.excusedCount > 0 && (
                <div className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <ShieldCheckIcon className="w-3.5 h-3.5" />
                  <span>
                    Có phép:{' '}
                    <strong className="font-mono text-blue-800 dark:text-blue-200">
                      {summary.excusedCount}
                    </strong>
                  </span>
                </div>
              )}
              {summary.unmarkedCount > 0 && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {t('attendance.mark.summary.unmarked')}:{' '}
                    <strong className="font-mono text-amber-800 dark:text-amber-200">
                      {summary.unmarkedCount}
                    </strong>
                  </span>
                </div>
              )}
              <div className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 flex items-center gap-1.5 shrink-0 ml-auto whitespace-nowrap">
                <ChartBarIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>{summary.attendanceRate}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExceptionForm((current) => !current)}
            disabled={!selectedClass}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-expanded={showExceptionForm}
          >
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shrink-0">
                <UserPlusIcon className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-black text-stone-900 dark:text-white uppercase tracking-wide">
                  Thêm học sinh học thử hoặc học bù
                </span>
                <span className="block text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Dùng khi học sinh chưa có trong danh sách lớp của ngày này
                </span>
              </span>
            </span>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
              {showExceptionForm ? 'Đóng' : 'Thêm'}
            </span>
          </button>

          {showExceptionForm && (
            <div className="border-t border-stone-200 dark:border-white/10 p-4 space-y-4">
              <div>
                <label
                  htmlFor="attendance-candidate-search"
                  className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  Tìm theo tên hoặc mã học sinh
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="attendance-candidate-search"
                    value={candidateSearch}
                    onChange={(event) => {
                      setCandidateSearch(event.target.value);
                      setCandidateSearchAttempted(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void findExceptionCandidates();
                    }}
                    placeholder="Ví dụ: Nguyễn An hoặc BH001"
                    className="flex-1 rounded-xl"
                  />
                  <Button
                    type="button"
                    onClick={findExceptionCandidates}
                    disabled={searchingCandidates}
                    className="rounded-xl sm:w-auto"
                  >
                    {searchingCandidates ? 'Đang tìm...' : 'Tìm học sinh'}
                  </Button>
                </div>
              </div>

              {candidates.length > 0 ? (
                <fieldset>
                  <legend className="text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                    Chọn học sinh
                  </legend>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {candidates.map((candidate) => (
                      <label
                        key={candidate.id}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors duration-200 ${selectedCandidate?.id === candidate.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'border-stone-200 dark:border-white/10 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                      >
                        <input
                          type="radio"
                          name="attendance-candidate"
                          checked={selectedCandidate?.id === candidate.id}
                          onChange={() => setSelectedCandidate(candidate)}
                          className="accent-amber-600"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-stone-900 dark:text-white truncate">
                            {candidate.full_name}
                          </span>
                          <span className="block text-xs text-stone-600 dark:text-stone-400">
                            {candidate.student_code || candidate.email || 'Chưa có mã học sinh'}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : candidateSearchAttempted && !searchingCandidates ? (
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Không có kết quả phù hợp. Hãy kiểm tra lại tên hoặc mã học sinh.
                </p>
              ) : null}

              {selectedCandidate && (
                <div className="grid sm:grid-cols-[180px_1fr_auto] gap-3 items-end">
                  <div>
                    <label
                      htmlFor="attendance-exception-type"
                      className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Hình thức
                    </label>
                    <Select
                      id="attendance-exception-type"
                      value={exceptionType}
                      onChange={(event) =>
                        setExceptionType(event.target.value as 'Học thử' | 'Học bù')
                      }
                      className="rounded-xl"
                    >
                      <option value="Học thử">Học thử</option>
                      <option value="Học bù">Học bù</option>
                    </Select>
                  </div>
                  <div>
                    <label
                      htmlFor="attendance-exception-detail"
                      className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5"
                    >
                      Lý do cụ thể
                    </label>
                    <Input
                      id="attendance-exception-detail"
                      value={exceptionDetail}
                      onChange={(event) => setExceptionDetail(event.target.value)}
                      placeholder="Ví dụ: học bù buổi nghỉ ngày 25/10"
                      className="rounded-xl"
                    />
                  </div>
                  <Button type="button" onClick={addExceptionStudent} className="rounded-xl">
                    Thêm vào danh sách
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STICKY FAST ACTION & QUICK-MARK BAR ── */}
        {students.length > 0 && (
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-white/10 p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl sticky top-16 z-30 shadow-md space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-3">
            {/* Quick Mark All Buttons */}
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2 order-2 sm:order-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAll(AttendanceStatus.PRESENT)}
                className="rounded-xl border-emerald-200/80 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 uppercase text-[10px] font-black tracking-wider px-2.5 sm:px-3 h-8 shadow-xs cursor-pointer justify-center whitespace-nowrap"
              >
                <CheckCircleIcon className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                <span>{t('attendance.mark.actions.allPresent')}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAll(AttendanceStatus.ABSENT)}
                className="rounded-xl border-rose-200/80 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 uppercase text-[10px] font-black tracking-wider px-2.5 sm:px-3 h-8 shadow-xs cursor-pointer justify-center whitespace-nowrap"
              >
                <XCircleIcon className="w-3.5 h-3.5 mr-1 text-rose-600 shrink-0" />
                <span>{t('attendance.mark.actions.allAbsent')}</span>
              </Button>
            </div>

            {/* Search Box on Mobile/Desktop */}
            <div className="relative w-full sm:w-56 order-1 sm:order-2">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                aria-label="Tìm học sinh trong danh sách điểm danh"
                placeholder="Tìm học sinh theo tên, mã..."
                className="w-full pl-8 pr-7 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              {studentSearch && (
                <button
                  type="button"
                  onClick={() => setStudentSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-white p-0.5"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Actions: Zalo Report & Save */}
            <div className="grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2 order-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={copyZaloReport}
                className="rounded-xl border-blue-200/80 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 uppercase text-[10px] font-black tracking-wider px-2.5 sm:px-3 h-8 shadow-xs cursor-pointer justify-center whitespace-nowrap"
                title="Sao chép mẫu báo cáo điểm danh gửi Zalo phụ huynh"
              >
                <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Báo cáo Zalo</span>
              </Button>

              <Button
                onClick={saveAttendance}
                disabled={saving}
                className="relative rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs h-8 px-3 sm:px-5 shadow-md shadow-emerald-500/20 cursor-pointer justify-center whitespace-nowrap"
              >
                {hasUnsavedChanges && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
                {saving ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('attendance.mark.actions.saving')}</span>
                  </div>
                ) : (
                  <span>{t('attendance.mark.actions.save')}</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── ADAPTIVE STUDENT LIST: MOBILE CARDS & DESKTOP TABLE ── */}
        {loading ? (
          <LoadingState message={t('common.loading')} />
        ) : filteredStudents.length === 0 ? (
          <div className="py-20 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-white/10 text-center">
            <UserGroupIcon className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
            <p className="text-xs font-black text-stone-400 uppercase tracking-wider">
              {t('attendance.mark.table.noStudents')}
            </p>
          </div>
        ) : (
          <div>
            {/* 1. MOBILE CARD VIEW (Display on mobile / tablet < md) */}
            <div className="md:hidden space-y-2.5 animate-fade-in">
              {filteredStudents.map((student, idx) => {
                const isPresent = student.status === AttendanceStatus.PRESENT;
                const isAbsent = student.status === AttendanceStatus.ABSENT;
                const isLate = student.status === AttendanceStatus.LATE;
                const isExcused = student.status === AttendanceStatus.EXCUSED;
                const isUnmarked = student.status === 'unmarked';

                return (
                  <div
                    key={student.studentId}
                    className={`bg-white dark:bg-stone-900 p-3.5 rounded-2xl border transition-all shadow-xs space-y-2.5 ${
                      isPresent
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10'
                        : isAbsent
                          ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/10'
                          : isLate
                            ? 'border-amber-200 dark:border-amber-900/50 bg-amber-50/10'
                            : isExcused
                              ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/10'
                              : 'border-stone-200/80 dark:border-white/10'
                    }`}
                  >
                    {/* Top Row: Index + Student Info + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-black text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-black text-stone-900 dark:text-white text-sm uppercase tracking-tight leading-snug break-words">
                            {student.studentName}
                          </div>
                          <div className="text-[10px] font-bold text-stone-400 font-mono">
                            {student.studentCode || 'BH-ID'}
                          </div>
                          {student.enrollmentExceptionReason && (
                            <div className="mt-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 normal-case">
                              {student.enrollmentExceptionReason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Current Status Pill */}
                      <div>
                        {isPresent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase">
                            Có mặt
                          </span>
                        )}
                        {isAbsent && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase">
                            Vắng
                          </span>
                        )}
                        {isLate && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase">
                            Đi muộn
                          </span>
                        )}
                        {isExcused && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase">
                            Có phép
                          </span>
                        )}
                        {isUnmarked && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[9px] font-black uppercase">
                            Chưa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Touch controls: labels and icons avoid relying on color alone. */}
                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
                      <button
                        type="button"
                        onClick={() =>
                          updateStudentStatus(student.studentId, AttendanceStatus.PRESENT)
                        }
                        className={`min-h-11 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          isPresent
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-300 hover:text-emerald-600'
                        }`}
                      >
                        <CheckBadgeIcon className="w-4 h-4 shrink-0" />
                        <span>Có mặt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStudentStatus(student.studentId, AttendanceStatus.ABSENT)
                        }
                        className={`min-h-11 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          isAbsent
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-300 hover:text-rose-600'
                        }`}
                      >
                        <XCircleIcon className="w-4 h-4 shrink-0" />
                        <span>Vắng</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStudentStatus(student.studentId, AttendanceStatus.LATE)
                        }
                        className={`min-h-11 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          isLate
                            ? 'bg-amber-500 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-300 hover:text-amber-700'
                        }`}
                      >
                        <ClockIcon className="w-4 h-4 shrink-0" />
                        <span>Đi muộn</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateStudentStatus(student.studentId, AttendanceStatus.EXCUSED)
                        }
                        className={`min-h-11 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          isExcused
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-300 hover:text-blue-700'
                        }`}
                      >
                        <ShieldCheckIcon className="w-4 h-4 shrink-0" />
                        <span>Có phép</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(student.studentId, 'unmarked')}
                        disabled={Boolean(student.recordId)}
                        title={
                          student.recordId
                            ? 'Bản ghi đã lưu cần chọn một trạng thái điểm danh'
                            : undefined
                        }
                        className={`col-span-2 min-h-11 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                          isUnmarked
                            ? 'bg-stone-600 text-white shadow-sm'
                            : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                        }`}
                      >
                        <Squares2X2Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>Chưa</span>
                      </button>
                    </div>

                    {/* Note Input */}
                    <div>
                      <input
                        type="text"
                        value={student.remarks || ''}
                        aria-label={`Ghi chú điểm danh cho ${student.studentName}`}
                        placeholder={t('attendance.mark.table.placeholder')}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          setStudents((prev) =>
                            prev.map((s) =>
                              s.studentId === student.studentId ? { ...s, remarks: newVal } : s
                            )
                          );
                          setHasUnsavedChanges(true);
                        }}
                        className="w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-white/10 rounded-xl py-1.5 px-3 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. DESKTOP COMPACT TABLE VIEW (Display on md and larger screens) */}
            <div className="hidden md:block bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-100 dark:divide-white/5">
                  <thead>
                    <tr className="bg-stone-50/90 dark:bg-stone-800/80">
                      <th className="w-12 px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-stone-400">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-stone-400">
                        {t('attendance.mark.table.student')}
                      </th>
                      <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-wider text-stone-400">
                        {t('attendance.mark.table.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider text-stone-400">
                        {t('attendance.mark.table.remarks')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                    {filteredStudents.map((student, idx) => {
                      const isPresent = student.status === AttendanceStatus.PRESENT;
                      const isAbsent = student.status === AttendanceStatus.ABSENT;
                      const isLate = student.status === AttendanceStatus.LATE;
                      const isExcused = student.status === AttendanceStatus.EXCUSED;
                      const isUnmarked = student.status === 'unmarked';

                      return (
                        <tr
                          key={student.studentId}
                          className="hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors"
                        >
                          <td className="px-4 py-2.5 text-center font-mono text-xs text-stone-400 font-bold">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-2.5">
                            <div>
                              <div className="font-black text-stone-900 dark:text-white uppercase text-xs">
                                {student.studentName}
                              </div>
                              <div className="text-[10px] font-mono text-stone-400">
                                {student.studentCode || 'BH-ID'}
                              </div>
                              {student.enrollmentExceptionReason && (
                                <div className="mt-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 normal-case">
                                  {student.enrollmentExceptionReason}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="inline-flex p-1 bg-stone-100 dark:bg-stone-800 rounded-xl gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  updateStudentStatus(student.studentId, AttendanceStatus.PRESENT)
                                }
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight flex items-center gap-1 transition-colors cursor-pointer ${
                                  isPresent
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-stone-500 hover:text-emerald-600'
                                }`}
                              >
                                <CheckBadgeIcon className="w-3.5 h-3.5" />
                                <span>Có mặt</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateStudentStatus(student.studentId, AttendanceStatus.ABSENT)
                                }
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight flex items-center gap-1 transition-colors cursor-pointer ${
                                  isAbsent
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-stone-500 hover:text-rose-600'
                                }`}
                              >
                                <XCircleIcon className="w-3.5 h-3.5" />
                                <span>Vắng</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateStudentStatus(student.studentId, AttendanceStatus.LATE)
                                }
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight flex items-center gap-1 transition-colors cursor-pointer ${
                                  isLate
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-stone-500 hover:text-amber-700'
                                }`}
                              >
                                <ClockIcon className="w-3.5 h-3.5" />
                                <span>Đi muộn</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateStudentStatus(student.studentId, AttendanceStatus.EXCUSED)
                                }
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight flex items-center gap-1 transition-colors cursor-pointer ${
                                  isExcused
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-stone-500 hover:text-blue-700'
                                }`}
                              >
                                <ShieldCheckIcon className="w-3.5 h-3.5" />
                                <span>Có phép</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateStudentStatus(student.studentId, 'unmarked')}
                                disabled={Boolean(student.recordId)}
                                title={
                                  student.recordId
                                    ? 'Bản ghi đã lưu cần chọn một trạng thái điểm danh'
                                    : undefined
                                }
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-tight flex items-center gap-1 transition-colors cursor-pointer ${
                                  isUnmarked
                                    ? 'bg-stone-600 text-white shadow-xs'
                                    : 'text-stone-500 hover:text-stone-900'
                                }`}
                              >
                                <Squares2X2Icon className="w-3 h-3" />
                                <span>Chưa</span>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="text"
                              value={student.remarks || ''}
                              aria-label={`Ghi chú điểm danh cho ${student.studentName}`}
                              placeholder={t('attendance.mark.table.placeholder')}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setStudents((prev) =>
                                  prev.map((s) =>
                                    s.studentId === student.studentId
                                      ? { ...s, remarks: newVal }
                                      : s
                                  )
                                );
                                setHasUnsavedChanges(true);
                              }}
                              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl py-1 px-3 text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
