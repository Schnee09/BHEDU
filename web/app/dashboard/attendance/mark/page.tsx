'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/contexts/I18nContext';
import {
  apiFetch,
  getClasses,
  getClassStudents,
  getAttendance,
  bulkCreateAttendance,
} from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { AttendanceStatus } from '@/lib/attendance/types';
import { Button, LoadingState } from '@/components/ui';
import Badge from '@/components/ui/badge';
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
  ChartBarIcon
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
}

interface AttendanceSummary {
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  attendanceRate: number;
}

export default function AttendanceMarkingPage() {
  return (
    <PageGuard permissions="attendance.mark">
      <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg" />
      </div>}>
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
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [studentSearch, setStudentSearch] = useState<string>('');

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

  // Load classes on mount
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
      const res = await getClasses({ limit: 100 });
      const classList = (res.data || []) as any[];
      setClasses(classList.map((c) => ({ id: c.id, name: c.name })));
      
      if (!selectedClass && classList.length > 0) {
        setSelectedClass(classList[0].id);
      }
    } catch (error) {
      console.error('Failed to load classes', error);
      setClasses([]);
    }
  };

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        getClassStudents(selectedClass),
        getAttendance({ class_id: selectedClass, date: date, limit: 1000 }),
      ]);

      const classStudents = studentsRes || [];
      const attendanceRecords = attendanceRes.data || [];

      const mappedStudents: StudentAttendanceView[] = classStudents.map((s: any) => {
        const record = attendanceRecords.find((r: any) => r.student_id === s.id);
        return {
          studentId: s.id,
          studentName: s.full_name || s.name || 'Unknown',
          studentCode: s.student_code || s.student_id || '',
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
      toast.error(t('attendance.mark.table.noStudents'));
    } finally {
      setLoading(false);
    }
  }, [selectedClass, date, t]);

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
      const recordsToSave = students
        .filter((s) => s.status !== 'unmarked')
        .map((student) => ({
          student_id: student.studentId,
          status: student.status,
          notes: student.remarks,
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
    <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto space-y-3 sm:space-y-4 relative z-10">
        {/* ── ULTRA-COMPACT UNIFIED HEADER ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-3 sm:p-5 shadow-sm space-y-3">
          {/* Row 1: Back + Title + Class & Date Selectors */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => router.push('/dashboard/attendance')}
                className="p-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-stone-600 dark:text-stone-300 transition-all cursor-pointer shrink-0"
                title={t('attendance.mark.backToDashboard')}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ClipboardDocumentCheckIcon className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-900 dark:text-white uppercase leading-none truncate">
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
                  className="rounded-xl border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-800 h-9 text-xs font-bold uppercase tracking-tight"
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
                  className="rounded-xl border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-800 h-9 text-xs font-bold uppercase tracking-tight"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Live Summary Stats Pill Bar (Compact & Mobile-friendly) */}
          {summary && (
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-1 border-t border-stone-100 dark:border-white/5 text-xs font-black">
              <div className="px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0">
                <UserGroupIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>{t('attendance.mark.summary.total')}: <strong className="font-mono text-stone-900 dark:text-white">{summary.totalStudents}</strong></span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-1.5 shrink-0">
                <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('attendance.mark.summary.present')}: <strong className="font-mono text-emerald-800 dark:text-emerald-200">{summary.presentCount}</strong></span>
              </div>
              <div className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-1.5 shrink-0">
                <XCircleIcon className="w-3.5 h-3.5 text-rose-600" />
                <span>{t('attendance.mark.summary.absent')}: <strong className="font-mono text-rose-800 dark:text-rose-200">{summary.absentCount}</strong></span>
              </div>
              {summary.unmarkedCount > 0 && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-1.5 shrink-0">
                  <ExclamationCircleIcon className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('attendance.mark.summary.unmarked')}: <strong className="font-mono text-amber-800 dark:text-amber-200">{summary.unmarkedCount}</strong></span>
                </div>
              )}
              <div className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30 flex items-center gap-1.5 shrink-0 ml-auto">
                <ChartBarIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>{summary.attendanceRate}%</span>
              </div>
            </div>
          )}
        </div>

        {/* ── STICKY FAST ACTION & QUICK-MARK BAR ── */}
        {students.length > 0 && (
          <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-white/10 p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl flex flex-wrap items-center justify-between gap-2.5 sticky top-3 sm:top-6 z-30 shadow-md">
            {/* Quick Mark All Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAll(AttendanceStatus.PRESENT)}
                className="rounded-xl border-emerald-200/80 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 uppercase text-[10px] font-black tracking-wider px-3 h-8 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <CheckCircleIcon className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                <span>{t('attendance.mark.actions.allPresent')}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAll(AttendanceStatus.ABSENT)}
                className="rounded-xl border-rose-200/80 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 uppercase text-[10px] font-black tracking-wider px-3 h-8 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <XCircleIcon className="w-3.5 h-3.5 mr-1 text-rose-600" />
                <span>{t('attendance.mark.actions.allAbsent')}</span>
              </Button>
            </div>

            {/* Search Box + Save Button */}
            <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Tìm học sinh..."
                  className="w-full pl-7 pr-2.5 py-1 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">🔍</span>
              </div>

              {hasUnsavedChanges && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/40 shrink-0">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                  <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase hidden sm:inline">
                    {t('attendance.mark.actions.unsaved')}
                  </span>
                </div>
              )}

              <Button
                onClick={saveAttendance}
                disabled={saving}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-xs h-8 px-4 sm:px-6 shadow-md shadow-emerald-500/20 cursor-pointer whitespace-nowrap"
              >
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
                const isUnmarked = student.status === 'unmarked';

                return (
                  <div
                    key={student.studentId}
                    className={`bg-white dark:bg-stone-900 p-3.5 rounded-2xl border transition-all shadow-xs space-y-2.5 ${
                      isPresent
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10'
                        : isAbsent
                        ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/10'
                        : 'border-stone-200/80 dark:border-white/10'
                    }`}
                  >
                    {/* Top Row: Index + Student Info + Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center font-black text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-stone-900 dark:text-white text-sm uppercase tracking-tight truncate">
                            {student.studentName}
                          </div>
                          <div className="text-[10px] font-bold text-stone-400 font-mono">
                            {student.studentCode || 'BH-ID'}
                          </div>
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
                        {isUnmarked && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[9px] font-black uppercase">
                            Chưa
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Touch Segmented Toggle (3-State Buttons: Touch target >= 44px) */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl">
                      <button
                        type="button"
                        onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.PRESENT)}
                        className={`h-10 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
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
                        onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.ABSENT)}
                        className={`h-10 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
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
                        onClick={() => updateStudentStatus(student.studentId, 'unmarked')}
                        className={`h-10 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
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
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="inline-flex p-0.5 bg-stone-100 dark:bg-stone-800 rounded-xl gap-1">
                              <button
                                type="button"
                                onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.PRESENT)}
                                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
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
                                onClick={() => updateStudentStatus(student.studentId, AttendanceStatus.ABSENT)}
                                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
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
                                onClick={() => updateStudentStatus(student.studentId, 'unmarked')}
                                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
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
