'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useTranslation } from '@/contexts/I18nContext';
import { apiFetch } from '@/lib/api/client';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import Badge from '@/components/ui/badge';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon,
  UserCircleIcon,
  AcademicCapIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
  student?: {
    full_name: string;
    student_id: string;
    email: string;
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
    <Suspense fallback={<div className="min-h-screen bg-transparent flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg" />
    </div>}>
      <AttendanceHistoryPageContent />
    </Suspense>
  );
}

function AttendanceHistoryPageContent() {
  const { t } = useTranslation();
  const { isStudent, loading: permsLoading } = usePermissions();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (!searchQuery) return records;
    const query = searchQuery.toLowerCase();
    return records.filter(
      (record) =>
        record.student?.full_name?.toLowerCase().includes(query) ||
        record.student?.student_id?.toLowerCase().includes(query) ||
        record.class?.name?.toLowerCase().includes(query)
    );
  }, [records, searchQuery]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      present: { variant: 'success', label: t('attendance.present') },
      absent: { variant: 'danger', label: t('attendance.absent') },
      late: { variant: 'warning', label: t('attendance.late') },
      excused: { variant: 'info', label: t('attendance.excused') },
    };
    const config = variants[status] || { variant: 'default', label: status };
    
    return (
      <Badge
        variant={config.variant}
        className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm border border-white/10"
      >
        {config.label}
      </Badge>
    );
  };

  if (permsLoading) return <div className="min-h-screen bg-transparent flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full shadow-lg" />
  </div>;

  return (
    <div className="min-h-screen bg-transparent py-8 px-4 sm:px-6 lg:px-10">
      <div className="max-w-[1400px] mx-auto space-y-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 glass-premium p-6 md:p-10 rounded-[40px] border border-emerald-500/10 shadow-2xl relative overflow-hidden animate-fade-in text-stone-900">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm mb-4">
              <ClockIcon className="w-4 h-4" />
              {isStudent ? t('attendance.history.personal') : t('attendance.history.management')}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none mb-4">
              {isStudent ? t('attendance.history.title') : t('attendance.history.adminTitle')}
            </h1>
            <p className="text-sm font-medium text-stone-500 max-w-lg leading-relaxed">
              {isStudent
                ? t('attendance.history.description')
                : t('attendance.history.adminDescription')}
            </p>
          </div>

          {!isStudent && (
            <div className="relative z-10">
               <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[11px]"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                {t('attendance.history.export')}
              </Button>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-xl rounded-[40px] animate-fade-in delay-100 overflow-visible relative">
           <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none rounded-[40px]" />
           <CardBody className="p-10 relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {!isStudent && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                    {t('common.search')}
                  </label>
                  <div className="relative group">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 group-focus-within:text-emerald-500 transition-colors" />
                    <Input
                      type="text"
                      placeholder={t('attendance.history.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold placeholder:stone-300 shadow-inner"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  {t('attendance.mark.class')}
                </label>
                <div className="relative group">
                  <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                  <Select
                    value={selectedClass}
                    onChange={(e: any) => {
                      setSelectedClass(e.target.value);
                      setPage(1);
                    }}
                    className="pl-12 h-12 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold appearance-none shadow-inner uppercase text-[11px] tracking-tight"
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

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  {t('common.status')}
                </label>
                <Select
                  value={selectedStatus}
                  onChange={(e: any) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-12 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold shadow-inner uppercase text-[11px] tracking-tight"
                >
                  <option value="">{t('attendance.history.allStatuses')}</option>
                  <option value="present">{t('attendance.present')}</option>
                  <option value="absent">{t('attendance.absent')}</option>
                  <option value="late">{t('attendance.late')}</option>
                  <option value="excused">{t('attendance.excused')}</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-1">
                  {t('common.date')}
                </label>
                <div className="flex gap-4">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/50 transition-all text-[10px] font-black uppercase shadow-inner"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 bg-stone-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500/50 transition-all text-[10px] font-black uppercase shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-stone-100 pt-8">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest">
                  {loading ? t('attendance.mark.actions.saving') : t('attendance.history.resultsFound', { count: filteredRecords.length })}
                </p>
              </div>

              {(selectedClass || selectedStatus || startDate || endDate || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedClass('');
                    setSelectedStatus('');
                    setStartDate('');
                    setEndDate('');
                    setSearchQuery('');
                    setPage(1);
                  }}
                  className="group flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm"
                >
                  <XMarkIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  {t('attendance.history.clearFilters')}
                </button>
              )}
            </div>
           </CardBody>
        </Card>

        {/* Results Area */}
        <div className="animate-fade-in delay-200">
          <div className="glass-premium rounded-[40px] border border-white/20 shadow-2xl overflow-hidden relative min-h-[400px]">
             <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-stone-50/10 to-transparent pointer-events-none" />
             
              {loading && filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6">
                  <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg" />
                  <p className="text-stone-300 font-black uppercase tracking-[0.3em] text-xs">
                    {t('attendance.history.fetching')}
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-8">
                  <div className="w-24 h-24 bg-stone-50 rounded-[32px] flex items-center justify-center shadow-inner group overflow-hidden">
                     <CalendarIcon className="w-12 h-12 text-stone-200 group-hover:scale-110 group-hover:text-stone-300 transition-all duration-700" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-stone-900 font-black uppercase tracking-tighter text-xl italic">
                      {t('attendance.history.noData')}
                    </h3>
                    <p className="text-stone-400 text-sm font-medium mt-2 max-w-xs mx-auto">
                      {t('attendance.history.noDataDesc')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadRecords}
                    className="rounded-[20px] px-8 h-12 border-stone-200 font-black uppercase tracking-widest text-[10px]"
                  >
                    {t('attendance.history.reload')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-left border-collapse font-Be_Vietnam_Pro">
                      <thead>
                        <tr className="bg-stone-50/50 border-b border-stone-100">
                          <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-400">
                             {t('attendance.history.table.time')}
                          </th>
                          {!isStudent && (
                            <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-400">
                               {t('attendance.history.table.student')}
                            </th>
                          )}
                          <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-400">
                             {t('attendance.history.table.class')}
                          </th>
                          <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-400 text-center">
                             {t('attendance.history.table.status')}
                          </th>
                          <th className="px-10 py-6 text-[11px] font-black uppercase tracking-widest text-stone-400">
                             {t('attendance.history.table.notes')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50 bg-white/40">
                        {filteredRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="group/row hover:bg-emerald-50/20 transition-all duration-300"
                          >
                            <td className="px-10 py-8">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-stone-900 tracking-tighter uppercase italic">
                                  {new Date(record.date).toLocaleDateString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </span>
                                <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mt-1">
                                  {new Date(record.date).toLocaleDateString('vi-VN', {
                                    weekday: 'long',
                                  })}
                                </span>
                              </div>
                            </td>
                            {!isStudent && (
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-[20px] bg-stone-100 flex items-center justify-center text-emerald-600 font-black tracking-tighter text-sm uppercase shadow-inner group-hover/row:bg-emerald-600 group-hover/row:text-white transition-all duration-500">
                                    {record.student?.full_name?.substring(0, 2)}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-base font-black text-stone-900 tracking-tight uppercase leading-none mb-1">
                                      {record.student?.full_name}
                                    </span>
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                      <UserCircleIcon className="w-3.5 h-3.5" />
                                      {record.student?.student_id}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            )}
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center group-hover/row:bg-white group-hover/row:shadow-sm transition-all">
                                  <AcademicCapIcon className="w-4 h-4 text-stone-400" />
                                </div>
                                <span className="text-sm font-black text-stone-600 uppercase tracking-tight">
                                  {record.class?.name || 'GEN-CLASS'}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-8 text-center">
                              {getStatusBadge(record.status)}
                            </td>
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-3">
                                <DocumentTextIcon className={cn("w-4 h-4", record.notes ? "text-emerald-500" : "text-stone-200")} />
                                <p
                                  className={cn(
                                    'text-xs font-medium max-w-[200px] truncate group-hover/row:max-w-[300px] transition-all duration-500',
                                    record.notes
                                      ? 'text-stone-500'
                                      : 'text-stone-300 italic'
                                  )}
                                >
                                  {record.notes || t('attendance.history.table.noNotes')}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="px-10 py-8 bg-stone-50/80 backdrop-blur-md flex items-center justify-between gap-6 relative z-10 border-t border-stone-100">
                    <div className="flex items-center gap-4 text-stone-400 font-black uppercase text-[10px] tracking-widest">
                      <span>{t('attendance.history.pagination.page')}</span>
                      <div className="h-10 min-w-[40px] px-3 bg-white rounded-xl flex items-center justify-center text-xs font-black text-emerald-600 border border-emerald-500/20 shadow-sm">
                        {page}
                      </div>
                      <span>{t('attendance.history.pagination.of')} {totalPages}</span>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={page <= 1}
                        className="h-12 w-12 flex items-center justify-center rounded-[20px] bg-white border border-stone-100 hover:border-emerald-600/30 hover:text-emerald-600 disabled:opacity-20 disabled:pointer-events-none transition-all shadow-sm active:scale-90"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setPage((p) => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={page >= totalPages}
                        className="h-12 w-12 flex items-center justify-center rounded-[20px] bg-white border border-stone-100 hover:border-emerald-600/30 hover:text-emerald-600 disabled:opacity-20 disabled:pointer-events-none transition-all shadow-sm active:scale-90"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
