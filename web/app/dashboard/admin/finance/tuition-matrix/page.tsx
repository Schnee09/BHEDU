'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import Icons from '@/components/ui/Icons';
import { Button } from '@/components/ui';
import PageGuard from '@/components/PageGuard';
import { useFetch } from '@/hooks/useFetch';

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
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  // Grid months to display
  const months = ['2026-06-01', '2026-07-01', '2026-08-01'];

  // Track pending grid changes: { [studentId_month]: paid_boolean }
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch options
  const { data: yearsRes } = useFetch<{ success: boolean; data: AcademicYear[] }>('/api/admin/academic-years');
  const { data: classesRes } = useFetch<{ success: boolean; data: ClassOption[] }>('/api/admin/classes?limit=100');

  const years = yearsRes?.data || [];
  const classes = classesRes?.data || [];

  // Default year selection
  useEffect(() => {
    if (years.length > 0 && !selectedYear) {
      const current = years.find(y => y.is_current);
      setSelectedYear(current ? current.id : (years[0]?.id || ''));
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

  const { data: matrixData, loading, error, refetch } = useFetch<MatrixResponse>(
    selectedClass && selectedYear ? `/api/admin/finance/tuition-matrix?${matrixQuery}` : ''
  );

  const students = matrixData?.students || [];
  const matrix = matrixData?.matrix || {};

  // Reset updates when class/year changes
  useEffect(() => {
    setPendingUpdates({});
  }, [selectedClass, selectedYear]);

  const handleCheckboxChange = (studentId: string, month: string, currentPaid: boolean) => {
    const key = `${studentId}_${month}`;
    const newPaidValue = !currentPaid;

    setPendingUpdates((prev) => {
      const next = { ...prev };
      
      // If the new value matches the original value in the database, remove it from updates
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
        alert(`Đã lưu thành công ${data.data.updatedCount} thay đổi học phí!`);
        setPendingUpdates({});
        refetch();
      } else {
        alert(`Lỗi: ${data.error || 'Không thể lưu các thay đổi học phí'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi kết nối');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = Object.keys(pendingUpdates).length > 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <a href="/dashboard/admin/finance" className="text-stone-400 hover:text-stone-600 transition-colors">
              <Icons.Back className="w-6 h-6" />
            </a>
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Icons.Layout className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-black text-stone-900 dark:text-white uppercase tracking-tight">
              Bảng Lưới Học Phí
            </h1>
          </div>
          <p className="text-sm text-stone-500 max-w-2xl">
            Giao diện lưới Excel trực quan. Đánh dấu học sinh đã nộp học phí hàng tháng bằng cách click checkbox.
          </p>
        </div>

        {/* Dropdowns & Actions */}
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2.5 bg-white/85 dark:bg-stone-900/80 border border-stone-200 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none"
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                Năm {y.name}
              </option>
            ))}
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 bg-white/85 dark:bg-stone-900/80 border border-stone-200 dark:border-white/10 rounded-xl text-sm font-bold focus:outline-none"
          >
            <option value="">Chọn lớp học...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Lớp {c.name}
              </option>
            ))}
          </select>

          <Button
            onClick={handleSaveChanges}
            disabled={!hasChanges || isSaving}
            className={`rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              hasChanges
                ? 'bg-indigo-600 hover:bg-indigo-750 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-stone-100 dark:bg-stone-900 text-stone-400 dark:text-stone-600 cursor-not-allowed'
            }`}
          >
            <Icons.Check className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : `Lưu ${Object.keys(pendingUpdates).length} thay đổi`}
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <Card className="glass-crystal rounded-3xl p-6 overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-500 font-semibold gap-3">
            <Icons.Refresh className="w-5 h-5 animate-spin" />
            Đang tải lưới học phí...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500 font-semibold">
            Có lỗi xảy ra khi tải dữ liệu lưới học phí.
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 font-medium">
            <Icons.Users className="w-12 h-12 text-stone-300 mb-4" />
            Lớp học hiện tại chưa có học sinh nào đăng ký.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-stone-200 dark:border-white/5 rounded-sharp">
              <thead>
                <tr className="bg-stone-50 dark:bg-stone-900/50 text-left text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                  <th className="border border-stone-200 dark:border-white/5 px-6 py-4">Họ và tên</th>
                  <th className="border border-stone-200 dark:border-white/5 px-6 py-4">Mã số</th>
                  {months.map((m) => {
                    const date = new Date(m);
                    return (
                      <th
                        key={m}
                        className="border border-stone-200 dark:border-white/5 px-6 py-4 text-center min-w-[150px]"
                      >
                        Tháng {date.getMonth() + 1}/{date.getFullYear()}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-stone-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="border border-stone-200 dark:border-white/5 px-6 py-4 text-sm font-semibold">
                      {student.full_name}
                    </td>
                    <td className="border border-stone-200 dark:border-white/5 px-6 py-4 text-sm font-mono text-stone-500">
                      {student.student_code || '—'}
                    </td>
                    {months.map((month) => {
                      const updateKey = `${student.id}_${month}`;
                      const cell = matrix[student.id]?.[month] || { status: 'not_created' };
                      
                      // Compute current state (takes pending changes into account)
                      const isOriginallyPaid = cell.status === 'paid';
                      const isCurrentlyPaid = pendingUpdates[updateKey] !== undefined 
                        ? pendingUpdates[updateKey] 
                        : isOriginallyPaid;

                      const isChanged = pendingUpdates[updateKey] !== undefined;

                      return (
                        <td
                          key={month}
                          onClick={() => handleCheckboxChange(student.id, month, isCurrentlyPaid)}
                          className={`border border-stone-200 dark:border-white/5 px-6 py-4 text-center cursor-pointer select-none transition-all ${
                            isChanged
                              ? 'bg-indigo-500/10 dark:bg-indigo-500/5'
                              : isCurrentlyPaid
                                ? 'bg-emerald-500/5 dark:bg-emerald-500/3'
                                : ''
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <input
                              type="checkbox"
                              checked={isCurrentlyPaid}
                              readOnly
                              className={`w-5 h-5 rounded cursor-pointer transition-all ${
                                isCurrentlyPaid 
                                  ? 'text-emerald-600 border-emerald-500 focus:ring-emerald-500' 
                                  : 'text-stone-300 border-stone-300 dark:border-white/10 focus:ring-indigo-500'
                              }`}
                            />
                            {/* Short indicator text */}
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${
                              isCurrentlyPaid 
                                ? 'text-emerald-600 dark:text-emerald-400' 
                                : 'text-stone-400 dark:text-stone-600'
                            }`}>
                              {isCurrentlyPaid ? 'Đã đóng' : 'Chưa đóng'}
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
        )}
      </Card>
    </div>
  );
}
