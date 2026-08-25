'use client';

import { useEffect, useState, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { useProfile } from '@/hooks/useProfile';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch, getAttendance } from '@/lib/api/client';
import { Table } from '@/components/ui/table';
import Badge from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui';
import { routes } from '@/lib/routes';
import PageGuard from '@/components/PageGuard';
import { ResponsiveTable, MobileCard } from '@/components/ui/ResponsiveTable';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ChartBarIcon,
  FunnelIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface AttendanceRecord {
  id: string;
  date: string;
  status: 'present' | 'absent';
  remarks: string | null;
  className: string;
  subjectName?: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
}

export default function AttendancePageGuarded() {
  return (
    <PageGuard permissions="attendance.view">
      <AttendancePage />
    </PageGuard>
  );
}

function AttendancePage() {
  const { t, locale } = useI18n();
  const { profile, loading: isProfileLoading } = useProfile();
  const { isStudent, isTeacher, isAdmin, isStaff } = usePermissions();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    attendanceRate: 0,
  });
  const [recentClasses, setRecentClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
  });

  const dateLocale = locale === 'vi' ? vi : enUS;

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status && filters.status !== 'all') params.status = filters.status;

      const res = await getAttendance(params);
      const recordsData = res.data || [];

      setAttendanceRecords(recordsData);

      const totalDays = recordsData.length;
      const presentDays = recordsData.filter(
        (r: AttendanceRecord) => r.status === 'present'
      ).length;
      const absentDays = recordsData.filter((r: AttendanceRecord) => r.status === 'absent').length;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      setStats({ totalDays, presentDays, absentDays, attendanceRate });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('common.error');
      console.error('Failed to fetch attendance:', err);
      setError(errorMessage);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    if (isStudent && profile) {
      fetchAttendance();
    } else if ((isTeacher || isStaff || isAdmin) && profile) {
      loadTeacherContext();
    }
  }, [isStudent, isTeacher, isStaff, isAdmin, profile, fetchAttendance]);

  const loadTeacherContext = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/classes/my-classes');
      if (res.ok) {
        const data = await res.json();
        const personal = data.myClasses || [];
        const others = (data.classes || []).filter(
          (c: any) => !personal.some((p: any) => p.id === c.id)
        );
        setRecentClasses([...personal, ...others].slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to load teacher context:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isProfileLoading || (isStudent && loading)) {
    return (
      <div className="min-h-screen bg-transparent py-4 sm:py-8 px-2.5 sm:px-6 lg:px-10">
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-8">
          <div className="h-28 sm:h-40 w-full bg-stone-100 dark:bg-stone-850 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 sm:h-32 bg-stone-100 dark:bg-stone-850 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // STUDENT VIEW
  if (isStudent) {
    return (
      <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-10">
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs relative overflow-hidden animate-fade-in">
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                <ClipboardDocumentCheckIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 dark:text-white">
                  {t('attendance.dashboard.myAttendance')}
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {t('attendance.dashboard.viewHistory')}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {t('attendance.dashboard.totalDays')}
                </p>
                <CalendarDaysIcon className="w-4 h-4 text-stone-400" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                {stats.totalDays}
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {t('attendance.dashboard.presentDays')}
                </p>
                <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {stats.presentDays}
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  {t('attendance.dashboard.absentDays')}
                </p>
                <XCircleIcon className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 tracking-tight">
                {stats.absentDays}
              </p>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 shadow-xs p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {t('attendance.dashboard.attendanceRate')}
                </p>
                <ChartBarIcon className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
                {stats.attendanceRate}%
              </p>
              <div className="mt-2 h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${stats.attendanceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                <ClockIcon className="w-6 h-6 text-emerald-500" />
                {t('attendance.dashboard.history')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 rounded-2xl border-stone-200 bg-white/50 backdrop-blur-sm font-bold uppercase tracking-widest text-[10px]"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                {t('attendance.dashboard.filter')}
              </Button>
            </div>

            {showFilters && (
              <div className="glass-premium rounded-[32px] border border-white/20 p-8 shadow-xl animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">
                      {t('common.date')}
                    </label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      className="rounded-2xl border-stone-200 bg-white/50"
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">
                      {t('common.date')}
                    </label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      className="rounded-2xl border-stone-200 bg-white/50"
                      onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-stone-500 ml-1">
                      {t('common.status')}
                    </label>
                    <Select
                      value={filters.status}
                      className="rounded-2xl border-stone-200 bg-white/50"
                      onChange={(e: any) =>
                        setFilters((prev) => ({ ...prev, status: e.target.value }))
                      }
                    >
                      <option value="all">{t('common.all')}</option>
                      <option value="present">{t('attendance.present')}</option>
                      <option value="absent">{t('attendance.absent')}</option>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 glass-premium rounded-[32px] animate-pulse" />
                ))}
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="glass-premium rounded-[40px] border-2 border-dashed border-stone-200 p-20 text-center">
                <EmptyState
                  icon={<CalendarDaysIcon className="w-16 h-16 text-stone-300 mx-auto mb-6" />}
                  title={t('common.noData')}
                  description={t('attendance.history.noDataDesc')}
                />
              </div>
            ) : (
              <div className="glass-premium rounded-[32px] border border-white/20 shadow-xl overflow-hidden">
                <ResponsiveTable
                  mobileView={
                    <div className="space-y-4 p-4">
                      {attendanceRecords.map((record) => (
                        <MobileCard
                          key={record.id}
                          title={record.subjectName || record.className}
                          subtitle={
                            record.date
                              ? format(new Date(record.date), 'EEEE, dd/MM/yyyy', {
                                  locale: dateLocale,
                                })
                              : '---'
                          }
                          status={{
                            label:
                              record.status === 'present'
                                ? t('attendance.present')
                                : t('attendance.absent'),
                            color: record.status === 'present' ? 'green' : 'red',
                          }}
                          fields={[
                            { label: t('students.class'), value: record.className },
                            { label: t('common.remarks'), value: record.remarks || '---' },
                          ]}
                          className="rounded-2xl border-stone-100 shadow-sm"
                        />
                      ))}
                    </div>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-stone-50/50">
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {t('common.date')}
                          </th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {t('students.class')}
                          </th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {t('grades.subject')}
                          </th>
                          <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {t('common.status')}
                          </th>
                          <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-stone-400">
                            {t('common.remarks')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {attendanceRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-emerald-50/30 transition-colors group"
                          >
                            <td className="px-8 py-6 text-sm font-bold text-stone-500">
                              {record.date ? format(new Date(record.date), 'dd/MM/yyyy') : '---'}
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-stone-900">
                              {record.className}
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-stone-600">
                              {record.subjectName || '-'}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <Badge
                                variant={record.status === 'present' ? 'success' : 'danger'}
                                className="rounded-full px-4 py-1 font-black uppercase tracking-widest text-[9px]"
                              >
                                {record.status === 'present'
                                  ? t('attendance.present')
                                  : t('attendance.absent')}
                              </Badge>
                            </td>
                            <td className="px-8 py-6 text-sm text-stone-400 italic">
                              {record.remarks || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ResponsiveTable>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // TEACHER / ADMIN VIEW
  const sections = [
    {
      title: t('attendance.dashboard.manualMarking'),
      description: t('attendance.dashboard.manualMarkingDesc'),
      href: routes.attendance.mark(),
      icon: PresentationChartLineIcon,
      color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: t('attendance.dashboard.reports'),
      description: t('attendance.dashboard.reportsDesc'),
      href: routes.attendance.reports(),
      icon: ChartBarIcon,
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: t('attendance.dashboard.history'),
      description: t('attendance.history.adminDescription'),
      href: '/dashboard/attendance/history',
      icon: ClockIcon,
      color: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1600px] mx-auto space-y-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 glass-premium p-6 md:p-10 rounded-[40px] border border-emerald-500/10 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-stone-900 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <AcademicCapIcon className="w-8 h-8 text-emerald-600" />
              </div>
              {t('attendance.dashboard.title')}
            </h1>
            <p className="mt-4 text-sm font-medium text-stone-500 max-w-lg leading-relaxed">
              {t('attendance.dashboard.description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section) => (
            <Link key={section.href} href={section.href} className="group">
              <Card className="h-full glass-premium hover-up transition-all border border-white/20 shadow-xl rounded-[32px] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-stone-100 group-hover:bg-emerald-500 transition-colors" />
                <CardBody className="flex flex-col items-center text-center p-10 relative">
                  <div
                    className={`p-5 rounded-[24px] mb-6 transition-all group-hover:scale-110 border ${section.color}`}
                  >
                    <section.icon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-black text-stone-900 mb-4 tracking-tight uppercase">
                    {section.title}
                  </h3>
                  <p className="text-stone-500 text-sm font-medium leading-relaxed">
                    {section.description}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        {/* Teacher Recent Activity */}
        {(isTeacher || isStaff || isAdmin) && recentClasses.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-3 px-2">
              <ClipboardDocumentCheckIcon className="w-6 h-6 text-emerald-500" />
              {t('attendance.dashboard.myClasses')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="glass-premium p-6 rounded-[28px] border border-white/20 shadow-lg flex items-center justify-between hover-up transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center font-black text-stone-400 group-hover:bg-emerald-500 group-hover:text-white transition-all uppercase tracking-tighter">
                      {cls.name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-black text-stone-900 tracking-tight uppercase text-sm">
                        {cls.name}
                      </p>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                        {cls.subject_name || 'Instruction'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/attendance/mark?classId=${cls.id}`}
                    className="p-3 bg-stone-50 text-stone-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Efficiency Tips */}
        <div className="glass-premium bg-stone-900 rounded-[40px] border-none shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-10 blur-sm group-hover:opacity-20 transition-opacity">
            <ClipboardDocumentCheckIcon className="w-48 h-48 text-white" />
          </div>
          <CardBody className="flex flex-col md:flex-row items-center md:items-start gap-8 p-12 relative z-10 text-white">
            <div className="p-5 bg-white/10 rounded-[28px] backdrop-blur-xl border border-white/10 shrink-0">
              <InformationCircleIcon className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-black tracking-tight uppercase italic text-emerald-400">
                {t('attendance.dashboard.tipTitle')}
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-stone-300 font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span dangerouslySetInnerHTML={{ __html: t('attendance.dashboard.tip1') }} />
                </li>
                <li className="flex items-center gap-4 text-stone-300 font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <span dangerouslySetInnerHTML={{ __html: t('attendance.dashboard.tip2') }} />
                </li>
              </ul>
            </div>
          </CardBody>
        </div>
      </div>
    </div>
  );
}
