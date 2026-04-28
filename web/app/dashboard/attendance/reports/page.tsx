'use client';

import { useState, useEffect, Suspense } from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { apiFetch, getClasses, getAttendance } from '@/lib/api/client';
import { toast } from 'react-hot-toast';
import { 
  ChartBarIcon, 
} from '@heroicons/react/24/outline';
import { parseISO, format, subDays, subMonths } from 'date-fns';
import { Button, LoadingState } from '@/components/ui';
import PageGuard from '@/components/PageGuard';

// Components
import dynamic from 'next/dynamic';
import { AttendanceStatCards } from '@/components/attendance/reports/AttendanceStatCards';

const AttendanceCharts = dynamic(
  () => import('@/components/attendance/reports/AttendanceCharts').then(mod => mod.AttendanceCharts),
  { ssr: false, loading: () => <div className="h-64 animate-pulse bg-stone-100 dark:bg-stone-800 rounded-[32px]"></div> }
);
import { ClassAttendanceTable } from '@/components/attendance/reports/ClassAttendanceTable';
import { PerformerLists } from '@/components/attendance/reports/PerformerLists';
import { DetailedAttendanceTable } from '@/components/attendance/reports/DetailedAttendanceTable';
import { AttendanceFilters } from '@/components/attendance/reports/AttendanceFilters';

// Types
interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks: string | null;
  student?: {
    id: string;
    email?: string;
    full_name?: string;
    student_code?: string;
  };
  class?: {
    id: string;
    name: string;
  };
}

interface Analytics {
  totalRecords: number;
  totalPresent: number;
  totalAbsent: number;
  attendanceRate: number;
  byStatus: Record<string, number>;
  byClass: Record<string, { name: string; count: number; present: number; rate: number }>;
  byStudent: Record<
    string,
    { name: string; studentId: string; count: number; present: number; rate: number }
  >;
}

interface ClassOption {
  id: string;
  name: string;
}

export default function AttendanceReportsPage() {
  return (
    <PageGuard permissions="attendance.reports">
      <Suspense fallback={<LoadingState />}>
        <AttendanceReportsContent />
      </Suspense>
    </PageGuard>
  );
}

function AttendanceReportsContent() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'overview' | 'details'>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, dateRange, startDate, endDate, statusFilter]);

  const loadClasses = async () => {
    try {
      const res = await getClasses({ limit: 100 });
      const classList = (res.data || []) as any[];
      setClasses(classList.map((c) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let start = '';
      let end = today.toISOString().split('T')[0] ?? '';

      if (dateRange === 'today') {
        start = end;
      } else if (dateRange === 'week') {
        start = subDays(today, 7).toISOString().split('T')[0] ?? '';
      } else if (dateRange === 'month') {
        start = subMonths(today, 1).toISOString().split('T')[0] ?? '';
      } else if (dateRange === 'term') {
        start = format(subMonths(today, 3), 'yyyy-MM-dd');
      } else if (dateRange === 'custom') {
        start = startDate;
        end = endDate;
      }

      const params: any = { limit: 1000, startDate: start, endDate: end };
      if (selectedClass) params.class_id = selectedClass;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await getAttendance(params);
      const data = (res.data || []) as AttendanceRecord[];
      setRecords(data);
      computeAnalytics(data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const computeAnalytics = (data: AttendanceRecord[]) => {
    const totalRecords = data.length;
    if (totalRecords === 0) {
      setAnalytics(null);
      return;
    }
    const totalPresent = data.filter((r) => r.status === 'present').length;
    const totalAbsent = data.filter((r) => r.status === 'absent').length;
    const attendanceRate = Math.round((totalPresent / totalRecords) * 100);
    const byStatus: Record<string, number> = {};
    const byClass: Record<string, any> = {};
    const byStudent: Record<string, any> = {};

    data.forEach((r) => {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      const clsId = r.class_id;
      if (!byClass[clsId]) byClass[clsId] = { name: r.class?.name || 'Class', count: 0, present: 0, rate: 0 };
      byClass[clsId].count++;
      if (r.status === 'present') byClass[clsId].present++;

      const stuId = r.student_id;
      if (!byStudent[stuId]) byStudent[stuId] = { name: r.student?.full_name || r.student?.email || 'Unknown', studentId: r.student?.student_code || stuId, count: 0, present: 0, rate: 0 };
      byStudent[stuId].count++;
      if (r.status === 'present') byStudent[stuId].present++;
    });

    Object.values(byClass).forEach((c) => c.rate = Math.round((c.present / c.count) * 100));
    Object.values(byStudent).forEach((s) => s.rate = Math.round((s.present / s.count) * 100));
    setAnalytics({ totalRecords, totalPresent, totalAbsent, attendanceRate, byStatus, byClass, byStudent });
  };

  const handleExport = () => {
    if (records.length === 0) return toast.error(t('common.noData'));
    setExporting(true);
    try {
      const headers = [t('common.date'), t('students.fullName'), t('students.studentId'), t('students.class'), t('common.status'), t('common.remarks')];
      const rows = records.map((record) => [
        format(parseISO(record.date), 'dd/MM/yyyy'),
        record.student?.full_name || record.student?.email || '',
        record.student?.student_code || record.student?.id || '',
        record.class?.name || '',
        record.status === 'present' ? t('attendance.present') : t('attendance.absent'),
        record.remarks || '',
      ]);
      const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) { toast.error(t('common.error')); } finally { setExporting(false); }
  };

  const getStatusColor = (status: string) => ({ present: 'bg-green-100 text-green-800', absent: 'bg-red-100 text-red-800', late: 'bg-yellow-100 text-yellow-800', excused: 'bg-blue-100 text-blue-800' }[status] || 'bg-gray-100 text-gray-800');
  const getRateColor = (rate: number) => rate >= 95 ? 'text-green-600' : rate >= 85 ? 'text-blue-600' : rate >= 75 ? 'text-yellow-600' : 'text-red-600';

  const studentStats = analytics ? Object.values(analytics.byStudent).sort((a, b) => b.rate - a.rate) : [];
  const topPerformers = studentStats.slice(0, 5);
  const bottomPerformers = studentStats.slice(-5).reverse();

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 glass-premium p-6 md:p-10 rounded-[40px] border border-emerald-500/10 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10"><h1 className="text-3xl md:text-4xl font-black tracking-tighter text-stone-900 flex items-center gap-4"><div className="p-3 bg-emerald-500/10 rounded-2xl"><ChartBarIcon className="w-8 h-8 text-emerald-600" /></div>{t('attendance.report.title')}</h1><p className="mt-4 text-sm font-medium text-stone-500 max-w-lg leading-relaxed">{t('attendance.report.description')}</p></div>
          <div className="relative z-10"><Button variant="success" onClick={handleExport} disabled={exporting || records.length === 0} className="px-8 h-12 rounded-2xl shadow-xl shadow-emerald-500/20 font-black uppercase tracking-widest text-[11px]">{exporting ? t('common.loading') : `📥 ${t('attendance.report.exportCsv')}`}</Button></div>
        </div>

        {/* Filters */}
        <AttendanceFilters classes={classes} selectedClass={selectedClass} setSelectedClass={setSelectedClass} dateRange={dateRange} setDateRange={setDateRange} statusFilter={statusFilter} setStatusFilter={setStatusFilter} viewMode={viewMode} setViewMode={setViewMode} t={t} />

        {loading ? <LoadingState message={t('common.loading')} /> : (
          <>
            {viewMode === 'overview' && analytics && (
              <>
                <AttendanceStatCards totalRecords={analytics.totalRecords} attendanceRate={analytics.attendanceRate} totalPresent={analytics.totalPresent} totalAbsent={analytics.totalAbsent} getRateColor={getRateColor} t={t} />
                <AttendanceCharts totalPresent={analytics.totalPresent} totalAbsent={analytics.totalAbsent} byClass={analytics.byClass} t={t} />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
                  <ClassAttendanceTable byClass={analytics.byClass} getRateColor={getRateColor} t={t} />
                  <PerformerLists topPerformers={topPerformers} bottomPerformers={bottomPerformers} getRateColor={getRateColor} t={t} />
                </div>
              </>
            )}
            {viewMode === 'details' && (
              <DetailedAttendanceTable records={records} searchTerm={searchTerm} onSearchChange={setSearchTerm} getStatusColor={getStatusColor} t={t} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
