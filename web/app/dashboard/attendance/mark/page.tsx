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

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 glass-premium p-6 md:p-10 rounded-[40px] border border-emerald-500/10 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl">
                <ClipboardDocumentCheckIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-sm">
                {t('attendance.mark.subtitle')}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-stone-900 leading-none">
              {t('attendance.mark.title')}
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 bg-stone-100/50 p-2 rounded-[32px] border border-stone-200/50 backdrop-blur-sm relative z-10 w-full md:w-auto">
            <div className="grid grid-cols-2 gap-4 w-full sm:w-[400px] px-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  {t('attendance.mark.class')}
                </label>
                <Select
                  value={selectedClass}
                  className="rounded-2xl border-stone-200 bg-white/80 h-10 text-xs font-bold uppercase tracking-tight"
                  onChange={(e: any) => setSelectedClass(e.target.value)}
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                   {t('attendance.mark.date')}
                </label>
                <Input
                  type="date"
                  value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-2xl border-stone-200 bg-white/80 h-10 text-xs font-bold uppercase tracking-tight"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Tracker */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { label: t('attendance.mark.summary.total'), value: summary.totalStudents, icon: UserGroupIcon, color: 'emerald' },
              { label: t('attendance.mark.summary.present'), value: summary.presentCount, icon: CheckBadgeIcon, color: 'emerald' },
              { label: t('attendance.mark.summary.absent'), value: summary.absentCount, icon: XCircleIcon, color: 'red' },
              { label: t('attendance.mark.summary.unmarked'), value: summary.unmarkedCount, icon: ExclamationCircleIcon, color: 'amber' },
              { label: t('attendance.mark.summary.rate'), value: `${summary.attendanceRate}%`, icon: ChartBarIcon, color: 'emerald' },
            ].map((stat, i) => (
              <div
                key={i}
                className={cn(
                  "glass-premium p-6 rounded-[32px] border border-white/20 shadow-xl hover-up transition-all group relative overflow-hidden",
                )}
              >
                <div className={`absolute top-0 right-0 w-20 h-20 bg-${stat.color}-500/5 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-60", stat.color === 'emerald' ? 'text-emerald-600' : stat.color === 'red' ? 'text-red-600' : 'text-amber-600')}>
                      {stat.label}
                    </p>
                    <stat.icon className={cn("w-5 h-5 opacity-40", stat.color === 'emerald' ? 'text-emerald-500' : stat.color === 'red' ? 'text-red-500' : 'text-amber-500')} />
                  </div>
                  <p className={`text-3xl font-black tracking-tighter text-stone-900`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions Bar */}
        {students.length > 0 && (
          <div className="glass-premium bg-white/80 backdrop-blur-xl border border-white/20 p-6 rounded-[32px] flex flex-wrap items-center justify-between gap-6 sticky top-8 z-30 shadow-2xl shadow-emerald-900/5 animate-fade-in">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] px-2 border-r border-stone-200">
                {t('attendance.mark.actions.quickMark')}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAll(AttendanceStatus.PRESENT)}
                className="rounded-2xl border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 uppercase text-[10px] font-black tracking-widest px-6 h-10 shadow-sm"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                {t('attendance.mark.actions.allPresent')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => markAll(AttendanceStatus.ABSENT)}
                className="rounded-2xl border-red-100 bg-red-50 text-red-600 hover:bg-red-100 uppercase text-[10px] font-black tracking-widest px-6 h-10 shadow-sm"
              >
                <XCircleIcon className="w-4 h-4 mr-2" />
                {t('attendance.mark.actions.allAbsent')}
              </Button>
            </div>

            <div className="flex items-center gap-6">
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100 animate-pulse">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
                    {t('attendance.mark.actions.unsaved')}
                  </span>
                </div>
              )}
              <Button
                onClick={saveAttendance}
                disabled={saving}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-[0.22em] text-[10px] h-11 px-10 shadow-xl shadow-emerald-500/20"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('attendance.mark.actions.saving')}
                  </div>
                ) : t('attendance.mark.actions.save')}
              </Button>
            </div>
          </div>
        )}

        {/* Student List Grid */}
        {loading ? (
          <LoadingState message={t('common.loading')} />
        ) : students.length === 0 ? (
          <div className="py-32 glass-premium rounded-[40px] border-2 border-dashed border-stone-100 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-stone-50/10 to-transparent pointer-events-none" />
             <UserGroupIcon className="w-20 h-20 text-stone-200 mx-auto mb-6" />
             <p className="text-sm font-black text-stone-300 uppercase tracking-[0.2em]">
               {t('attendance.mark.table.noStudents')}
             </p>
          </div>
        ) : (
          <div className="glass-premium rounded-[40px] border border-white/20 overflow-hidden shadow-2xl relative">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
            <table className="min-w-full divide-y divide-stone-100 relative z-10 font-Be_Vietnam_Pro">
              <thead>
                <tr className="bg-stone-50/80 backdrop-blur-md">
                  <th className="px-10 py-6 text-left text-[11px] font-black uppercase tracking-widest text-stone-400">
                    {t('attendance.mark.table.student')}
                  </th>
                  <th className="px-10 py-6 text-left text-[11px] font-black uppercase tracking-widest text-stone-400">
                    {t('attendance.mark.table.status')}
                  </th>
                  <th className="px-10 py-6 text-left text-[11px] font-black uppercase tracking-widest text-stone-400">
                    {t('attendance.mark.table.remarks')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 bg-white/40">
                {students.map((student, idx) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-emerald-50/20 transition-all group"
                  >
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center font-black text-stone-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-inner">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <div className="font-black text-stone-900 uppercase tracking-tighter text-base">
                            {student.studentName}
                          </div>
                          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-stone-100 rounded-md">{student.studentCode || 'BH-ID'}</span>
                             <span className="text-stone-300">•</span>
                             <span className="lowercase">{student.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex gap-3">
                        {[
                          {
                            val: AttendanceStatus.PRESENT,
                            icon: CheckBadgeIcon,
                            label: t('attendance.present'),
                            color: 'emerald',
                          },
                          { 
                            val: AttendanceStatus.ABSENT, 
                            icon: XCircleIcon, 
                            label: t('attendance.absent'), 
                            color: 'red' 
                          },
                          { 
                            val: 'unmarked', 
                            icon: Squares2X2Icon, 
                            label: t('attendance.mark.summary.unmarked'), 
                            color: 'stone' 
                          },
                        ].map((opt) => {
                          const isActive = student.status === opt.val;
                          const activeStyles = {
                            emerald: 'bg-emerald-600 text-white shadow-emerald-500/30 ring-emerald-500/20',
                            red: 'bg-red-600 text-white shadow-red-500/30 ring-red-500/20',
                            stone: 'bg-stone-600 text-white shadow-stone-500/30 ring-stone-500/20',
                          };
                          
                          return (
                            <button
                              key={opt.val}
                              onClick={() => updateStudentStatus(student.studentId, opt.val)}
                              className={cn(
                                'h-10 px-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border ring-4 ring-transparent',
                                isActive
                                  ? activeStyles[opt.color as keyof typeof activeStyles]
                                  : 'bg-white border-stone-100 text-stone-400 hover:border-emerald-600/30 hover:text-emerald-600'
                              )}
                            >
                              <opt.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-stone-300 group-hover:text-emerald-500")} />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="relative group/input max-w-md">
                        <Input
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
                          className="w-full bg-stone-50/50 border-stone-100 border-none rounded-xl py-3 px-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all placeholder:stone-300 shadow-inner"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-start pt-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/attendance')}
            className="font-black text-[11px] uppercase tracking-widest text-stone-400 hover:text-emerald-600 transition-all flex items-center gap-3 px-8 h-12 bg-white/50 backdrop-blur-sm rounded-[24px] border border-white/20"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            {t('attendance.mark.backToDashboard')}
          </Button>
        </div>
      </div>
    </div>
  );
}
