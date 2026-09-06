'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  LayoutGrid,
  CreditCard,
  Check,
  RotateCw,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import PageGuard from '@/components/PageGuard';
import { useFetch } from '@/hooks/useFetch';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

interface AcademicYear {
  id: string;
  name: string;
  is_current: boolean;
}

interface ClassOption {
  id: string;
  name: string;
}

interface StudentRow {
  id: string;
  full_name: string;
  student_code: string | null;
}

interface MatrixCell {
  invoiceId?: string;
  status: 'not_created' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  total?: number;
  paid?: number;
}

interface MatrixResponse {
  students: StudentRow[];
  matrix: Record<string, Record<string, MatrixCell>>;
}

export default function TuitionMatrixPage() {
  return (
    <PageGuard permissions="finance.manage">
      <TuitionMatrixContent />
    </PageGuard>
  );
}

function TuitionMatrixContent() {
  const toast = useToast();
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileView, setMobileView] = useState<'grid' | 'cards'>('grid');

  // Grid months to display
  const months = ['2026-06-01', '2026-07-01', '2026-08-01'];

  // Track pending grid changes: { [studentId_month]: paid_boolean }
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch options
  const { data: yearsRes } = useFetch<{ success: boolean; data: AcademicYear[] }>(
    '/api/admin/academic-years'
  );
  const { data: classesRes } = useFetch<{ success: boolean; data: ClassOption[] }>(
    '/api/admin/classes?limit=100'
  );

  const years = yearsRes?.data || [];
  const classes = classesRes?.data || [];

  // Default year selection
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      const current = years.find((y) => y.is_current);
      setSelectedYear(current ? current.id : years[0]?.id || '');
    }
  }, [years, selectedYear]);

  // Default class selection
  useEffect(() => {
    if (classes.length > 0 && !selectedClass) {
      setSelectedClass(classes[0]?.id || '');
    }
  }, [classes, selectedClass]);

  // Fetch tuition matrix data
  const matrixQuery = new URLSearchParams({
    class_id: selectedClass,
    academic_year_id: selectedYear,
    months: months.join(','),
  }).toString();

  const {
    data: matrixData,
    loading,
    error,
    refetch,
  } = useFetch<MatrixResponse>(
    selectedClass && selectedYear ? `/api/admin/finance/tuition-matrix?${matrixQuery}` : ''
  );

  const rawStudents = matrixData?.students || [];
  const matrix = matrixData?.matrix || {};

  // Filter students by search query
  const students = useMemo(() => {
    if (!searchQuery.trim()) return rawStudents;
    const q = searchQuery.toLowerCase().trim();
    return rawStudents.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        (s.student_code && s.student_code.toLowerCase().includes(q))
    );
  }, [rawStudents, searchQuery]);

  // Reset updates when class/year changes
  useEffect(() => {
    setPendingUpdates({});
  }, [selectedClass, selectedYear]);

  const handleCheckboxChange = (studentId: string, month: string, currentPaid: boolean) => {
    const key = `${studentId}_${month}`;
    const newPaidValue = !currentPaid;

    setPendingUpdates((prev) => {
      const next = { ...prev };
      const originalCell = matrix[studentId]?.[month];
      const originalPaid = originalCell?.status === 'paid';

      if (newPaidValue === originalPaid) {
        delete next[key];
      } else {
        next[key] = newPaidValue;
      }

      return next;
    });
  };

  const handleSaveChanges = async () => {
    const updateList = Object.entries(pendingUpdates).map(([key, paid]) => {
      const [studentId, month] = key.split('_');
      return { studentId, month, paid };
    });

    if (updateList.length === 0) return;

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/finance/tuition-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass,
          academicYearId: selectedYear,
          updates: updateList,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(
          'Thành công',
          `Đã lưu thành công ${data.data?.updatedCount || updateList.length} thay đổi học phí!`
        );
        setPendingUpdates({});
        refetch();
      } else {
        toast.error('Lỗi', data.error || 'Không thể lưu các thay đổi học phí');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi kết nối', 'Đã xảy ra lỗi kết nối đến máy chủ');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(pendingUpdates).length > 0;
  const changesCount = Object.keys(pendingUpdates).length;

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-32 md:pb-16 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin/finance"
              className="p-2 -ml-2 rounded-xl text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
              title="Quay lại Quản lý tài chính"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
                Bảng Lưới Học Phí
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5 hidden sm:block">
                Giao diện quản lý học phí trực quan. Đánh dấu học sinh đã nộp học phí hàng tháng
                theo lớp.
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 sm:hidden pl-1">
            Giao diện lưới Excel trực quan. Đánh dấu học phí theo từng tháng.
          </p>
        </div>

        {/* Desktop Save Action */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges || isSaving}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer',
              hasChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md shadow-amber-500/20 active:scale-95'
                : 'bg-stone-100 dark:bg-stone-800/80 text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700/60 cursor-not-allowed opacity-80'
            )}
          >
            {isSaving ? (
              <RotateCw className="w-4 h-4 animate-spin text-stone-500" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>
              {isSaving
                ? 'Đang lưu...'
                : hasChanges
                  ? `Lưu ${changesCount} thay đổi`
                  : 'Lưu thay đổi'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Filters & Controls Bar ── */}
      <div className="bg-white dark:bg-[#14120E] p-3.5 sm:p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3 items-center">
          {/* Year selector */}
          <div className="lg:col-span-3">
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 sm:hidden">
              Năm học
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  Năm {y.name} {y.is_current ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Class selector */}
          <div className="lg:col-span-4">
            <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 sm:hidden">
              Lớp học
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <option value="">-- Chọn lớp học --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Lớp {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="lg:col-span-3 relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm học sinh theo tên, mã..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Mobile view toggle */}
          <div className="lg:col-span-2 flex items-center justify-end gap-1.5 pt-1 sm:pt-0">
            <div className="flex items-center bg-stone-100 dark:bg-stone-900 p-1 rounded-xl border border-stone-200 dark:border-stone-800 w-full sm:w-auto justify-center">
              <button
                onClick={() => setMobileView('grid')}
                className={cn(
                  'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                  mobileView === 'grid'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lưới</span>
              </button>
              <button
                onClick={() => setMobileView('cards')}
                className={cn(
                  'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
                  mobileView === 'cards'
                    ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                )}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Thẻ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      {loading ? (
        <Card className="p-12 text-center rounded-3xl border border-stone-200 dark:border-stone-800">
          <div className="flex flex-col items-center justify-center gap-3 text-stone-500">
            <RotateCw className="w-6 h-6 animate-spin text-amber-500" />
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
              Đang tải bảng lưới học phí...
            </p>
          </div>
        </Card>
      ) : error ? (
        <Card className="p-12 text-center rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/10">
          <div className="flex flex-col items-center justify-center gap-3 text-rose-500">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-bold">Có lỗi xảy ra khi tải dữ liệu lưới học phí.</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              Thử lại
            </button>
          </div>
        </Card>
      ) : !selectedClass ? (
        <Card className="p-12 text-center rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
          <div className="flex flex-col items-center justify-center gap-3 text-stone-400">
            <SlidersHorizontal className="w-10 h-10 text-stone-300 dark:text-stone-600" />
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300">
              Vui lòng chọn một lớp học
            </p>
            <p className="text-xs text-stone-400 max-w-sm">
              Chọn lớp học ở thanh điều khiển phía trên để hiển thị danh sách học phí.
            </p>
          </div>
        </Card>
      ) : students.length === 0 ? (
        <Card className="p-12 text-center rounded-3xl border border-dashed border-stone-200 dark:border-stone-800">
          <div className="flex flex-col items-center justify-center gap-3 text-stone-400">
            <Users className="w-10 h-10 text-stone-300 dark:text-stone-600" />
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300">
              {searchQuery ? 'Không tìm thấy học sinh phù hợp' : 'Lớp học chưa có học sinh nào'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* VIEW 1: EXCEL MATRIX VIEW (WITH STICKY STUDENT COLUMN) */}
          {mobileView === 'grid' && (
            <div className="bg-white dark:bg-[#14120E] rounded-2xl sm:rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto no-scrollbar touch-pan-x">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-stone-900/70 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 text-xs font-bold uppercase tracking-wider">
                      {/* Sticky Student Column Header */}
                      <th className="sticky left-0 bg-stone-100 dark:bg-[#181612] px-3.5 sm:px-5 py-3.5 sm:py-4 z-20 min-w-[150px] sm:min-w-[200px] border-r border-stone-200 dark:border-stone-800 shadow-[2px_0_6px_rgba(0,0,0,0.03)] dark:shadow-[2px_0_6px_rgba(0,0,0,0.3)]">
                        Học sinh
                      </th>
                      <th className="px-3 sm:px-4 py-3.5 sm:py-4 min-w-[100px] border-r border-stone-100 dark:border-stone-800/60 hidden sm:table-cell">
                        Mã số (UID)
                      </th>
                      {months.map((m) => {
                        const date = new Date(m);
                        return (
                          <th
                            key={m}
                            className="px-3 sm:px-5 py-3.5 sm:py-4 text-center min-w-[110px] sm:min-w-[140px] border-r border-stone-100 dark:border-stone-800/60 last:border-r-0"
                          >
                            <span className="block text-xs font-black">
                              Tháng {date.getMonth() + 1}
                            </span>
                            <span className="text-[10px] font-medium text-stone-400">
                              /{date.getFullYear()}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60 text-xs sm:text-sm">
                    {students.map((student, idx) => (
                      <tr
                        key={student.id}
                        className={cn(
                          'transition-colors',
                          idx % 2 === 0
                            ? 'bg-white dark:bg-[#14120E]'
                            : 'bg-stone-50/40 dark:bg-[#171510]'
                        )}
                      >
                        {/* Sticky Student Name Column */}
                        <td
                          className={cn(
                            'sticky left-0 px-3.5 sm:px-5 py-3 z-10 font-bold text-stone-900 dark:text-stone-100 border-r border-stone-200 dark:border-stone-800 shadow-[2px_0_6px_rgba(0,0,0,0.03)] dark:shadow-[2px_0_6px_rgba(0,0,0,0.3)]',
                            idx % 2 === 0
                              ? 'bg-white dark:bg-[#14120E]'
                              : 'bg-stone-50 dark:bg-[#171510]'
                          )}
                        >
                          <div className="flex flex-col min-w-[130px] sm:min-w-[170px]">
                            <span className="truncate">{student.full_name}</span>
                            <span className="text-[10px] font-mono font-medium text-stone-400 sm:hidden">
                              {student.student_code || 'Chưa cấp UID'}
                            </span>
                          </div>
                        </td>

                        {/* Student Code Column (Desktop) */}
                        <td className="px-3 sm:px-4 py-3 font-mono text-xs text-stone-500 border-r border-stone-100 dark:border-stone-800/60 hidden sm:table-cell">
                          {student.student_code ? (
                            <span className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[11px] font-bold text-stone-700 dark:text-stone-300">
                              {student.student_code}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic text-[11px]">Chưa cấp mã</span>
                          )}
                        </td>

                        {/* Month Matrix Cells */}
                        {months.map((month) => {
                          const updateKey = `${student.id}_${month}`;
                          const cell = matrix[student.id]?.[month] || { status: 'not_created' };

                          const isOriginallyPaid = cell.status === 'paid';
                          const isCurrentlyPaid =
                            pendingUpdates[updateKey] !== undefined
                              ? pendingUpdates[updateKey]
                              : isOriginallyPaid;

                          const isChanged = pendingUpdates[updateKey] !== undefined;

                          return (
                            <td
                              key={month}
                              onClick={() =>
                                handleCheckboxChange(student.id, month, isCurrentlyPaid)
                              }
                              className={cn(
                                'px-2 sm:px-4 py-2.5 sm:py-3 text-center cursor-pointer select-none transition-all border-r border-stone-100 dark:border-stone-800/60 last:border-r-0',
                                isChanged
                                  ? 'bg-amber-500/10 dark:bg-amber-500/15 ring-1 ring-inset ring-amber-500/40'
                                  : isCurrentlyPaid
                                    ? 'bg-emerald-500/5 dark:bg-emerald-500/10 hover:bg-emerald-500/10'
                                    : 'hover:bg-stone-100/70 dark:hover:bg-white/5'
                              )}
                            >
                              <div className="flex flex-col items-center justify-center gap-1 py-1">
                                <div
                                  className={cn(
                                    'w-6 h-6 rounded-lg flex items-center justify-center transition-all shadow-2xs',
                                    isCurrentlyPaid
                                      ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                      : 'border-2 border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900'
                                  )}
                                >
                                  {isCurrentlyPaid && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>

                                <span
                                  className={cn(
                                    'text-[9px] sm:text-[10px] font-bold tracking-tight',
                                    isCurrentlyPaid
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-stone-400 dark:text-stone-500'
                                  )}
                                >
                                  {isCurrentlyPaid ? 'Đã đóng' : 'Chưa'}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: MOBILE CARD VIEW */}
          {mobileView === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {students.map((student) => {
                // Calculate paid count for summary
                let paidMonthsCount = 0;
                months.forEach((month) => {
                  const updateKey = `${student.id}_${month}`;
                  const cell = matrix[student.id]?.[month] || { status: 'not_created' };
                  const isOriginallyPaid = cell.status === 'paid';
                  const isCurrentlyPaid =
                    pendingUpdates[updateKey] !== undefined
                      ? pendingUpdates[updateKey]
                      : isOriginallyPaid;
                  if (isCurrentlyPaid) paidMonthsCount++;
                });

                return (
                  <div
                    key={student.id}
                    className="bg-white dark:bg-[#14120E] p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800/80 pb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {student.full_name?.charAt(0) || 'H'}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                            {student.full_name}
                          </h3>
                          <span className="font-mono text-[10px] text-stone-400">
                            {student.student_code || 'Chưa cấp UID'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0',
                          paidMonthsCount === months.length
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : paidMonthsCount > 0
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              : 'bg-stone-100 dark:bg-white/5 text-stone-500'
                        )}
                      >
                        Đã nộp {paidMonthsCount}/{months.length}
                      </span>
                    </div>

                    {/* Month Pills */}
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month) => {
                        const date = new Date(month);
                        const updateKey = `${student.id}_${month}`;
                        const cell = matrix[student.id]?.[month] || { status: 'not_created' };

                        const isOriginallyPaid = cell.status === 'paid';
                        const isCurrentlyPaid =
                          pendingUpdates[updateKey] !== undefined
                            ? pendingUpdates[updateKey]
                            : isOriginallyPaid;

                        const isChanged = pendingUpdates[updateKey] !== undefined;

                        return (
                          <button
                            key={month}
                            onClick={() => handleCheckboxChange(student.id, month, isCurrentlyPaid)}
                            className={cn(
                              'p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer',
                              isChanged
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/40'
                                : isCurrentlyPaid
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400'
                            )}
                          >
                            <span className="text-[11px] font-black">
                              T{date.getMonth() + 1}/{date.getFullYear()}
                            </span>
                            <div className="flex items-center gap-1">
                              {isCurrentlyPaid ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              )}
                              <span className="text-[10px] font-bold">
                                {isCurrentlyPaid ? 'Đã đóng' : 'Chưa'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── FLOATING MOBILE ACTION BAR (WHEN CHANGES EXIST) ── */}
      {hasChanges && (
        <div className="fixed bottom-20 left-4 right-4 z-40 md:hidden animate-in slide-in-from-bottom-5 duration-250">
          <div className="bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 pl-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <span className="text-xs font-bold text-stone-200">
                {changesCount} thay đổi chưa lưu
              </span>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              {isSaving ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Đang lưu...' : 'Lưu ngay'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
