'use client';

/**
 * Bulk Student Quick Create Page
 * Optimized layout with high density UI & batch grade assignment
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks';
import { apiFetch } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';

const gradeOptions = [
  { value: '', label: 'Tùy chọn khối lớp (Để trống nếu chưa rõ)' },
  { value: 'Lớp 6', label: 'Lớp 6 - THCS' },
  { value: 'Lớp 7', label: 'Lớp 7 - THCS' },
  { value: 'Lớp 8', label: 'Lớp 8 - THCS' },
  { value: 'Lớp 9', label: 'Lớp 9 - THCS (Luyện thi 10)' },
  { value: 'Lớp 10', label: 'Lớp 10 - THPT' },
  { value: 'Lớp 11', label: 'Lớp 11 - THPT' },
  { value: 'Lớp 12', label: 'Lớp 12 - THPT (Luyện thi ĐH)' },
];

export default function BulkCreatePageGuarded() {
  return (
    <PageGuard permissions="students.create">
      <BulkCreatePage />
    </PageGuard>
  );
}

function BulkCreatePage() {
  const router = useRouter();
  const toast = useToast();

  const [namesInput, setNamesInput] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  const handleProcess = async () => {
    const rawLines = namesInput.split('\n').filter((n) => n.trim().length > 0);

    if (rawLines.length === 0) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập ít nhất một họ tên học sinh');
      return;
    }

    if (rawLines.length > 50) {
      toast.error('Giới hạn vượt mức', 'Hệ thống chỉ xử lý tối đa 50 học sinh mỗi lượt');
      return;
    }

    setLoading(true);
    setResults([]);
    setErrors([]);

    try {
      const parsedStudents = rawLines.map((line) => {
        const trimmed = line.trim();
        // Support "Họ và Tên, Lớp 10" or "Họ và Tên | Lớp 10"
        if (trimmed.includes(',') || trimmed.includes('|')) {
          const parts = trimmed.split(/[,|]/);
          const name = parts[0]?.trim();
          const grade = parts[1]?.trim() || selectedGrade || undefined;
          return { full_name: name, grade_level: grade };
        }
        return { full_name: trimmed, grade_level: selectedGrade || undefined };
      });

      const payload = {
        students: parsedStudents,
      };

      const response = await apiFetch('/api/admin/students/bulk', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Xử lý dữ liệu thất bại');
      }

      setResults(data.data || []);
      setErrors(data.errors || []);

      if (data.data?.length > 0) {
        toast.success('Thành công', `Đã khởi tạo ${data.data.length} hồ sơ học sinh mới`);
      }

      if (data.errors?.length > 0) {
        toast.warning('Lưu ý', `${data.errors.length} hồ sơ gặp lỗi khi khởi tạo`);
      }
    } catch (error: any) {
      toast.error('Lỗi hệ thống', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;

    // BOM for Excel/Vietnamese characters support
    const BOM = '\uFEFF';
    const headers = ['Họ và tên', 'UID (Mã truy cập)', 'Mật khẩu tạm thời', 'Email'];
    const rows = results.map((r) => [r.full_name, r.student_code, r.password, r.email]);

    const csvContent =
      BOM + [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `danh_sach_truy_cap_hoc_sinh_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lineCount = namesInput.split('\n').filter((n) => n.trim()).length;

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 bg-stone-50 dark:bg-stone-950 min-h-screen animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm p-4 sm:p-5 border border-stone-200/80 dark:border-white/5 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <button
              onClick={() => router.push(routes.students.list())}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-300 font-bold uppercase tracking-wider text-[10px] hover:bg-amber-500 hover:text-white transition-all cursor-pointer mb-2"
            >
              <Icons.Back className="w-3 h-3" />
              Quay lại danh sách
            </button>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                Tạo nhanh học sinh hàng loạt
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Nhập danh sách họ tên học sinh để tự động tạo tài khoản, sinh UID và cấp mật khẩu.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800/60 px-3.5 py-2 rounded-xl border border-stone-200/60 dark:border-white/5 shrink-0">
            <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
              <Icons.Students className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                Giới hạn lượt
              </p>
              <p className="text-xs font-bold text-stone-900 dark:text-white">
                Tối đa 50 hồ sơ / lần
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Input Card */}
        <Card className="lg:col-span-5 p-4 sm:p-5 border border-stone-200/80 dark:border-white/5 shadow-sm bg-white dark:bg-stone-900 rounded-2xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">
                Danh sách học sinh
              </h2>
              <Badge
                variant="default"
                className={cn(
                  'px-2 py-0.5 font-bold text-[10px]',
                  lineCount > 50
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                )}
              >
                {lineCount} / 50 học sinh
              </Badge>
            </div>

            {/* Optional Batch Grade Assignment */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                Gán khối lớp mặc định
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-stone-800 dark:text-stone-200 font-medium"
              >
                {gradeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-500 dark:text-stone-400 mb-1">
                Mỗi dòng 1 học sinh (Ví dụ: Nguyễn Văn A hoặc Nguyễn Văn A, Lớp 10)
              </label>
              <textarea
                value={namesInput}
                onChange={(e) => setNamesInput(e.target.value)}
                placeholder={'Nguyễn Văn A\nTrần Thị B\nLê Văn C, Lớp 11'}
                className="w-full h-64 bg-stone-50 dark:bg-stone-950 p-3.5 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-mono resize-none transition-all placeholder:text-stone-400"
                disabled={loading}
              />
            </div>

            <Button
              variant="primary"
              className="w-full h-10 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs cursor-pointer"
              onClick={handleProcess}
              isLoading={loading}
              disabled={loading || lineCount === 0 || lineCount > 50}
            >
              <Icons.Upload className="w-3.5 h-3.5 mr-1.5" />
              Khởi tạo hồ sơ & Cấp mật khẩu
            </Button>

            <p className="text-[11px] text-center text-stone-400 font-medium">
              Hệ thống sẽ tự động tạo Email, Mã UID (HS2026xxxx) và Mật khẩu tạm thời
            </p>
          </div>
        </Card>

        {/* Results Card */}
        <Card className="lg:col-span-7 flex flex-col p-4 sm:p-5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-white/5 shadow-sm rounded-2xl min-h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white">Kết quả khởi tạo</h2>
              <p className="text-[11px] text-stone-400">
                {results.length > 0
                  ? `Đã tạo ${results.length} tài khoản thành công`
                  : 'Danh sách tài khoản sau khi xử lý sẽ xuất hiện tại đây'}
              </p>
            </div>
            {results.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Icons.Download className="w-3.5 h-3.5" />
                Tải file CSV
              </button>
            )}
          </div>

          <div className="flex-1">
            {results.length === 0 && errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-stone-300 dark:text-stone-600">
                <Icons.Grades className="w-12 h-12 opacity-20 mb-3" />
                <p className="text-xs text-stone-400 italic">Chưa có dữ liệu nào được xử lý</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Success Table */}
                {results.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-emerald-500/20">
                    <div className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-500/20 flex items-center gap-2">
                      <Icons.Success className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        Thành công ({results.length})
                      </span>
                    </div>
                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-white/5 font-semibold text-stone-500">
                            <th className="px-3.5 py-2">Họ và tên</th>
                            <th className="px-3 py-2 text-center">Mã UID</th>
                            <th className="px-3.5 py-2 text-right">Mật khẩu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-white/5">
                          {results.map((r, i) => (
                            <tr key={i} className="hover:bg-amber-500/5 transition-colors">
                              <td className="px-3.5 py-2 font-medium text-stone-800 dark:text-stone-200">
                                {r.full_name}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <code className="bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                                  {r.student_code}
                                </code>
                              </td>
                              <td className="px-3.5 py-2 text-right">
                                <code className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-mono font-bold text-[11px] select-all">
                                  {r.password}
                                </code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Errors List */}
                {errors.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-rose-500/20">
                    <div className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-500/20 flex items-center gap-2">
                      <Icons.Error className="w-3.5 h-3.5 text-rose-600" />
                      <span className="font-bold text-xs text-rose-700 dark:text-rose-400">
                        Lỗi phát sinh ({errors.length})
                      </span>
                    </div>
                    <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto">
                      {errors.map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg text-xs"
                        >
                          <Badge variant="danger" className="text-[9px] px-1.5 py-0.5">
                            LỖI
                          </Badge>
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {e.full_name}
                          </span>
                          <span className="text-stone-500 text-[11px] truncate">— {e.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
