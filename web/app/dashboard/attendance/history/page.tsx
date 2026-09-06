'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/contexts/I18nContext';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import Badge from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  TableCellsIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string | null;
  remarks?: string | null;
  student?: {
    full_name: string;
    student_id?: string;
    student_code?: string;
    email?: string;
  };
  class?: {
    name: string;
  };
}

interface ClassOption {
  id: string;
  name: string;
}

export default function AttendanceHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg" />
        </div>
      }
    >
      <AttendanceHistoryPageContent />
    </Suspense>
  );
}

function AttendanceHistoryPageContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isStudent, loading: permsLoading } = usePermissions();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  // Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    if (!permsLoading) {
      loadClasses();
    }
  }, [permsLoading]);

  const loadClasses = async () => {
    try {
      const response = await apiFetch('/api/classes/my-classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || data.data || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('classId', selectedClass);
      if (selectedStatus) params.append('status', selectedStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await apiFetch(`/api/attendance/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.data || []);
        const total = data.total || data.data?.length || 0;
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      }
    } catch (error) {
      console.error('Failed to load records:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedStatus, startDate, endDate, page, t]);

  useEffect(() => {
    if (!permsLoading) {
      loadRecords();
    }
  }, [permsLoading, loadRecords]);

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase().trim();
    return records.filter(
      (record) =>
        record.student?.full_name?.toLowerCase().includes(query) ||
        record.student?.student_code?.toLowerCase().includes(query) ||
        record.student?.student_id?.toLowerCase().includes(query) ||
        record.class?.name?.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  // Summary Metrics of current dataset
  const metrics = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const absent = filteredRecords.filter((r) => r.status === 'absent').length;
    const late = filteredRecords.filter((r) => r.status === 'late').length;
    const excused = filteredRecords.filter((r) => r.status === 'excused').length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [filteredRecords]);

  // Export CSV with UTF-8 BOM for Excel compatibility
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error(t('common.noData'));
      return;
    }
    setExporting(true);
    try {
      const headers = ['Ngày học', 'Học sinh', 'Mã học sinh', 'Lớp học', 'Trạng thái', 'Ghi chú'];
      const statusLabels: Record<string, string> = {
        present: 'Có mặt',
        absent: 'Vắng mặt',
        late: 'Đi muộn',
        excused: 'Có phép',
      };

      const rows = filteredRecords.map((r) => {
        const dateFormatted = new Date(r.date).toLocaleDateString('vi-VN');
        const studentName = r.student?.full_name || 'N/A';
        const studentCode = r.student?.student_code || r.student?.student_id || 'BH-ID';
        const className = r.class?.name || 'N/A';
        const status = statusLabels[r.status] || r.status;
        const note = r.notes || r.remarks || '';
        return [dateFormatted, studentName, studentCode, className, status, note];
      });

      const csvContent =
        '\uFEFF' +
        [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join(
          '\n'
        );

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `lich-su-diem-danh-${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Đã tải xuống file CSV thành công!');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(t('common.error'));
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      present: { variant: 'success', label: 'Có mặt', icon: CheckCircleIcon },
      absent: { variant: 'danger', label: 'Vắng', icon: XCircleIcon },
      late: { variant: 'warning', label: 'Đi muộn', icon: ClockIcon },
      excused: { variant: 'info', label: 'Có phép', icon: ExclamationCircleIcon },
    };
    const config = variants[status] || { variant: 'default', label: status, icon: ClockIcon };
    const Icon = config.icon;

    return (
      <Badge
        variant={config.variant}
        className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-xs inline-flex items-center gap-1.5"
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const getWeekdayName = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const day = dateObj.getDay();
    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return weekdays[day] || '';
  };

  if (permsLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg" />
      </div>
    );
  }

  const hasActiveFilters = Boolean(
    selectedClass || selectedStatus || startDate || endDate || searchQuery
  );

  return (
    <div className="min-h-screen bg-transparent py-3 sm:py-6 px-2.5 sm:px-6 lg:px-8 pb-28 md:pb-16 font-Be_Vietnam_Pro">
      <div className="max-w-[1600px] mx-auto space-y-3.5 sm:space-y-4 relative z-10">
        {/* ── HEADER CARD ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-4 sm:p-5 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => router.push('/dashboard/attendance')}
                className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-xl text-stone-600 dark:text-stone-300 transition-all cursor-pointer shrink-0"
                title={t('attendance.mark.backToDashboard')}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-2xl font-black tracking-tight text-stone-900 dark:text-white uppercase leading-none truncate">
                    {isStudent ? t('attendance.history.title') : t('attendance.history.adminTitle')}
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 truncate max-w-md">
                    {isStudent
                      ? t('attendance.history.description')
                      : t('attendance.history.adminDescription')}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions (Export + Refresh + View Toggle) */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
              {/* View Mode Toggle */}
              <div className="hidden sm:inline-flex p-0.5 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'table' || viewMode === 'auto'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  )}
                  title="Xem dạng Bảng"
                >
                  <TableCellsIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    'p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
                  )}
                  title="Xem dạng Thẻ"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={loadRecords}
                disabled={loading}
                className="rounded-xl border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 h-9 px-3 text-xs font-black uppercase tracking-wider cursor-pointer"
                title="Tải lại dữ liệu"
              >
                <ArrowPathIcon className={cn('w-3.5 h-3.5 mr-1', loading && 'animate-spin')} />
                <span className="hidden sm:inline">Làm mới</span>
              </Button>

              {!isStudent && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={exporting || filteredRecords.length === 0}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-3 sm:px-4 text-xs font-black uppercase tracking-wider shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-3.5 h-3.5 mr-1.5" />
                  <span>Xuất CSV</span>
                </Button>
              )}
            </div>
          </div>

          {/* KPI Live Metric Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-stone-100 dark:border-white/5 text-xs font-black">
            <div className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0 border border-stone-200/40 dark:border-white/5">
              <UserGroupIcon className="w-3.5 h-3.5 text-stone-500" />
              <span>
                Tổng bản ghi:{' '}
                <strong className="font-mono text-stone-900 dark:text-white">
                  {metrics.total}
                </strong>
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1.5 shrink-0">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Có mặt:{' '}
                <strong className="font-mono text-emerald-800 dark:text-emerald-200">
                  {metrics.present}
                </strong>
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40 flex items-center gap-1.5 shrink-0">
              <XCircleIcon className="w-3.5 h-3.5 text-rose-600" />
              <span>
                Vắng:{' '}
                <strong className="font-mono text-rose-800 dark:text-rose-200">
                  {metrics.absent}
                </strong>
              </span>
            </div>
            {metrics.late > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 flex items-center gap-1.5 shrink-0">
                <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Muộn:{' '}
                  <strong className="font-mono text-amber-800 dark:text-amber-200">
                    {metrics.late}
                  </strong>
                </span>
              </div>
            )}
            {metrics.excused > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 flex items-center gap-1.5 shrink-0">
                <ExclamationCircleIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Có phép:{' '}
                  <strong className="font-mono text-blue-800 dark:text-blue-200">
                    {metrics.excused}
                  </strong>
                </span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 shrink-0 ml-auto">
              <ChartBarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tỷ lệ có mặt:</span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-sm">
                {metrics.rate}%
              </strong>
            </div>
          </div>
        </div>

        {/* ── RESPONSIVE FILTERS PANEL ── */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 p-3.5 sm:p-4 shadow-sm space-y-3">
          <div
            className={cn(
              'grid gap-2.5 sm:gap-3',
              isStudent ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
            )}
          >
            {!isStudent && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  {t('common.search')}
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    type="text"
                    placeholder="Tên học sinh, mã HS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('attendance.mark.class')}
              </label>
              <div className="relative">
                <AcademicCapIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <Select
                  value={selectedClass}
                  onChange={(e: any) => {
                    setSelectedClass(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-9 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl text-xs font-bold uppercase tracking-tight"
                >
                  <option value="">{t('attendance.history.allClasses')}</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('common.status')}
              </label>
              <Select
                value={selectedStatus}
                onChange={(e: any) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="h-9 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl text-xs font-bold uppercase tracking-tight"
              >
                <option value="">{t('attendance.history.allStatuses')}</option>
                <option value="present">Có mặt</option>
                <option value="absent">Vắng mặt</option>
                <option value="late">Đi muộn</option>
                <option value="excused">Có phép</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                Khoảng ngày
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl text-[11px] font-bold"
                  title="Từ ngày"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="h-9 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-white/10 text-stone-900 dark:text-white rounded-xl text-[11px] font-bold"
                  title="Đến ngày"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-white/5">
              <span className="text-[11px] font-bold text-stone-400 dark:text-stone-500">
                Tìm thấy {filteredRecords.length} kết quả
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedClass('');
                  setSelectedStatus('');
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setPage(1);
                }}
                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 text-xs font-black uppercase tracking-wider px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                <span>Xóa bộ lọc</span>
              </button>
            </div>
          )}
        </div>

        {/* ── RESULTS SECTION ── */}
        <div className="space-y-3">
          {loading && filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-white/10 space-y-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-sm" />
              <p className="text-stone-400 font-black uppercase tracking-widest text-xs">
                {t('attendance.history.fetching')}
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-200 dark:border-white/10 text-center p-6">
              <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-2xl flex items-center justify-center mb-3">
                <CalendarIcon className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-stone-900 dark:text-white font-black uppercase text-base">
                {t('attendance.history.noData')}
              </h3>
              <p className="text-stone-400 text-xs font-medium mt-1 max-w-sm">
                {t('attendance.history.noDataDesc')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadRecords}
                className="mt-4 rounded-xl px-4 border-stone-200 dark:border-white/10 font-bold uppercase text-xs"
              >
                {t('attendance.history.reload')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 1. MOBILE CARDS VIEW (md:hidden or forced by viewMode === 'cards') */}
              <div
                className={cn(
                  'space-y-2.5',
                  viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'md:hidden'
                )}
              >
                {filteredRecords.map((record) => {
                  const isPresent = record.status === 'present';
                  const isAbsent = record.status === 'absent';
                  const isLate = record.status === 'late';
                  const noteText = record.notes || record.remarks;
                  const weekday = getWeekdayName(record.date);

                  return (
                    <div
                      key={record.id}
                      className={cn(
                        'bg-white dark:bg-stone-900 p-3.5 rounded-2xl border shadow-xs transition-all space-y-2.5',
                        isPresent
                          ? 'border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/10'
                          : isAbsent
                            ? 'border-rose-200/80 dark:border-rose-900/40 bg-rose-50/10'
                            : isLate
                              ? 'border-amber-200/80 dark:border-amber-900/40 bg-amber-50/10'
                              : 'border-stone-200/80 dark:border-white/10'
                      )}
                    >
                      {/* Top Header: Student Info + Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {!isStudent && (
                            <div className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 uppercase">
                              {record.student?.full_name?.substring(0, 2) || 'HS'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-black text-stone-900 dark:text-white text-sm uppercase tracking-tight truncate">
                              {isStudent ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                                  <AcademicCapIcon className="w-4 h-4" />
                                  Lớp {record.class?.name || '10A1'}
                                </span>
                              ) : (
                                record.student?.full_name || 'Học sinh'
                              )}
                            </div>
                            {!isStudent && (
                              <div className="text-[10px] font-bold text-stone-400 font-mono flex items-center gap-1">
                                <UserCircleIcon className="w-3 h-3" />
                                <span>
                                  {record.student?.student_code ||
                                    record.student?.student_id ||
                                    'BH-ID'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>{getStatusBadge(record.status)}</div>
                      </div>

                      {/* Middle Row: Date & Class */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-white/5 text-xs">
                        <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                          <CalendarIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="font-bold">
                            {new Date(record.date).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 font-semibold text-[10px]">
                            {weekday}
                          </span>
                        </div>
                        {!isStudent && (
                          <div className="flex items-center gap-1 text-stone-600 dark:text-stone-300 truncate font-bold uppercase text-[11px]">
                            <AcademicCapIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{record.class?.name || 'Lớp học'}</span>
                          </div>
                        )}
                      </div>

                      {/* Notes (if any) */}
                      {noteText && (
                        <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-100 dark:border-white/5 flex items-start gap-1.5 text-xs text-stone-600 dark:text-stone-300">
                          <DocumentTextIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="italic">{noteText}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP TABLE VIEW (hidden md:block or forced by viewMode === 'table') */}
              <div
                className={cn(
                  'bg-white dark:bg-stone-900 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-white/10 shadow-sm overflow-hidden',
                  viewMode === 'cards'
                    ? 'hidden'
                    : viewMode === 'table'
                      ? 'block'
                      : 'hidden md:block'
                )}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/90 dark:bg-stone-800/80 border-b border-stone-100 dark:border-white/5">
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-stone-400">
                          {t('attendance.history.table.time')}
                        </th>
                        {!isStudent && (
                          <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-stone-400">
                            {t('attendance.history.table.student')}
                          </th>
                        )}
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-stone-400">
                          {t('attendance.history.table.class')}
                        </th>
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-stone-400 text-center">
                          {t('attendance.history.table.status')}
                        </th>
                        <th className="px-6 py-3.5 text-[10px] font-black uppercase tracking-wider text-stone-400">
                          {t('attendance.history.table.notes')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                      {filteredRecords.map((record) => {
                        const noteText = record.notes || record.remarks;
                        const weekday = getWeekdayName(record.date);

                        return (
                          <tr
                            key={record.id}
                            className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-stone-900 dark:text-white uppercase font-mono">
                                  {new Date(record.date).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500 font-bold text-[10px] uppercase">
                                  {weekday}
                                </span>
                              </div>
                            </td>

                            {!isStudent && (
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase shrink-0">
                                    {record.student?.full_name?.substring(0, 2) || 'HS'}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-tight truncate">
                                      {record.student?.full_name || 'Học sinh'}
                                    </div>
                                    <div className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                                      <UserCircleIcon className="w-3 h-3" />
                                      <span>
                                        {record.student?.student_code ||
                                          record.student?.student_id ||
                                          'BH-ID'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            )}

                            <td className="px-6 py-4">
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-stone-800 dark:text-stone-200 border border-stone-200/50 dark:border-white/5">
                                <AcademicCapIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="text-xs font-black uppercase">
                                  {record.class?.name || 'Lớp học'}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              {getStatusBadge(record.status)}
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <DocumentTextIcon
                                  className={cn(
                                    'w-3.5 h-3.5 shrink-0',
                                    noteText
                                      ? 'text-emerald-500'
                                      : 'text-stone-300 dark:text-stone-600'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'text-xs max-w-[240px] truncate',
                                    noteText
                                      ? 'text-stone-700 dark:text-stone-300'
                                      : 'text-stone-400 dark:text-stone-500 italic'
                                  )}
                                >
                                  {noteText || 'Không có ghi chú'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── PAGINATION BAR ── */}
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-white/10 p-3 flex items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 font-black uppercase text-[10px] tracking-wider">
                  <span>Trang</span>
                  <div className="h-7 min-w-[28px] px-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 rounded-lg flex items-center justify-center text-xs font-mono font-black border border-emerald-500/20">
                    {page}
                  </div>
                  <span>/ {totalPages}</span>
                </div>

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page <= 1}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Trang trước"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={page >= totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Trang sau"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
