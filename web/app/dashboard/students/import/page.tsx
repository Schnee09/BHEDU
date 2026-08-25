/**
 * Bulk Student Import Page
 * Refactored with Strict Ban design system
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { routes } from '@/lib/routes';
import {
  parseCSV,
  validateImportData,
  generateCSVTemplate,
  type ImportPreview,
} from '@/lib/importService';
import { Button, Card, CardHeader, Badge } from '@/components/ui';
import { Icons } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import PageGuard from '@/components/PageGuard';

export default function BulkImportPageGuarded() {
  return (
    <PageGuard permissions="students.import">
      <BulkImportPage />
    </PageGuard>
  );
}

function BulkImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [importResults, setImportResults] = useState<{
    total: number;
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; email: string; error: string }>;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle file selection
  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selectedFile);

    try {
      // Parse and validate CSV
      const rows = await parseCSV(selectedFile);
      const validation = await validateImportData(rows);
      setPreview(validation);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể đọc tệp CSV');
      setFile(null);
      setPreview(null);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bieu_mau_nhap_lieu_hoc_sinh.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = async () => {
    if (!preview || preview.valid.length === 0) {
      alert('Không có dữ liệu hợp lệ để nhập');
      return;
    }

    if (preview.errorRows > 0) {
      const confirmed = confirm(
        `Đang có ${preview.errorRows} dòng gặp lỗi. Bạn có muốn tiếp tục nhập ${preview.validRows} học sinh hợp lệ không?`
      );
      if (!confirmed) return;
    }

    setImporting(true);

    try {
      const response = await apiFetch('/api/admin/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: preview.valid,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Nhập liệu thất bại');
      }

      setImportResults(data.results);
      setImportComplete(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Lỗi hệ thống khi nhập liệu');
    } finally {
      setImporting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportComplete(false);
    setImportResults(null);
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 relative overflow-x-hidden bg-stone-50 dark:bg-stone-950">
      <div className="max-w-[1200px] mx-auto relative z-10 animate-in fade-in duration-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-200/50 dark:border-white/5 mb-8">
          <div className="space-y-4">
            <Link
              href={routes.students.list()}
              className="group inline-flex items-center text-[10px] font-black text-amber-600 uppercase tracking-widest hover:translate-x-[-4px] transition-transform"
            >
              <Icons.Back className="w-3 h-3 mr-2" /> Quay lại danh sách
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-accent-glow" />
              <h1 className="text-3xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                Nhập liệu <span className="text-amber-500">Hàng loạt</span>
              </h1>
            </div>
            <p className="text-[11px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.2em] mt-2">
              Hệ thống xử lý hồ sơ tự động qua tệp tin CSV
            </p>
          </div>

          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="font-black uppercase tracking-widest text-[10px] h-12 px-6 border-stone-200 dark:border-white/10 hover:bg-stone-100 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            <Icons.Download className="w-3.5 h-3.5 mr-2" />
            Tải tệp tin biểu mẫu (VN)
          </Button>
        </div>

        {!importComplete ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Rail: Upload */}
            <div className="lg:col-span-12">
              <Card className="bg-white dark:bg-stone-900 border-stone-200/50 dark:border-white/5 shadow-2xl overflow-hidden rounded-[2.5rem] p-4">
                <div className="p-8 text-center">
                  <div
                    className={cn(
                      'border-2 border-dashed rounded-3xl p-16 transition-all duration-500 group relative overflow-hidden',
                      dragActive
                        ? 'border-amber-500 bg-amber-500/5 scale-[1.01]'
                        : 'border-stone-100 dark:border-white/5 hover:border-amber-500/50 hover:bg-stone-50/50 dark:hover:bg-white/[0.02]'
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <div className="w-24 h-24 bg-stone-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 group-hover:bg-amber-500/10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                        <Icons.Clipboard className="w-10 h-10 text-stone-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <span className="text-2xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight mb-3">
                        {file ? file.name : 'Kéo thả tệp CSV hoặc nhấn để chọn'}
                      </span>
                      <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-[0.3em]">
                        Định dạng hỗ trợ: .CSV (Bản mã UTF-8) • Tối đa 10 MB
                      </span>
                    </label>
                  </div>

                  {file && (
                    <div className="mt-8 flex items-center justify-between bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl shadow-amber-500/5">
                      <div className="flex items-center gap-6 text-left">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-amber-500/30">
                          <Icons.Check className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight text-lg">
                            {file.name}
                          </p>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                            {(file.size / 1024).toFixed(2)} KB • Sẵn sàng xử lý
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleFileChange(null)}
                        variant="ghost"
                        className="text-[10px] font-black text-red-500 hover:bg-red-500/10 uppercase tracking-widest px-6 h-11"
                      >
                        Loại bỏ tệp
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Preview and Validation Results */}
            {preview && (
              <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  <StatCardModern
                    label="Tổng số hồ sơ"
                    value={preview.totalRows}
                    color="blue"
                    icon={<Icons.Students className="w-6 h-6" />}
                  />
                  <StatCardModern
                    label="Hồ sơ hợp lệ"
                    value={preview.validRows}
                    color="emerald"
                    icon={<Icons.Success className="w-6 h-6" />}
                  />
                  <StatCardModern
                    label="Hồ sơ lỗi"
                    value={preview.errorRows}
                    color="rose"
                    icon={<Icons.Error className="w-6 h-6" />}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Errors & Warnings Rail */}
                  <div className="space-y-8">
                    {/* Errors */}
                    {preview.errors.length > 0 && (
                      <Card className="border-rose-500/20 bg-rose-500/[0.02] rounded-[2rem] p-8 shadow-xl">
                        <h3 className="font-serif font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight flex items-center gap-3 mb-6 text-xl">
                          <Icons.Error className="w-6 h-6" /> Lỗi bắt buộc (Cần xử lý)
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-3 custom-scrollbar">
                          {preview.errors.map((error, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-4 bg-white dark:bg-stone-900 border border-rose-100 dark:border-rose-500/10 rounded-2xl flex items-center gap-4 transition-all hover:translate-x-1"
                            >
                              <Badge variant="danger" className="font-black text-[9px] h-6 px-3">
                                Dòng {error.row}
                              </Badge>
                              <div className="flex-1">
                                <span className="font-black text-stone-400 uppercase tracking-widest mr-2">
                                  {error.field}:
                                </span>
                                <span className="text-stone-700 dark:text-stone-300 font-medium">
                                  {error.message}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Warnings */}
                    {preview.warnings.length > 0 && (
                      <Card className="border-amber-500/20 bg-amber-500/[0.02] rounded-[2rem] p-8 shadow-xl">
                        <h3 className="font-serif font-black text-amber-600 dark:text-amber-400 uppercase tracking-tight flex items-center gap-3 mb-6 text-xl">
                          <Icons.Warning className="w-6 h-6" /> Cảnh báo (Không bắt buộc)
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-3 custom-scrollbar">
                          {preview.warnings.map((warning, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-4 bg-white dark:bg-stone-900 border border-amber-100 dark:border-amber-500/10 rounded-2xl flex items-center gap-4 transition-all hover:translate-x-1"
                            >
                              <Badge variant="warning" className="font-black text-[9px] h-6 px-3">
                                Dòng {warning.row}
                              </Badge>
                              <div className="flex-1">
                                <span className="font-black text-stone-400 uppercase tracking-widest mr-2">
                                  {warning.field}:
                                </span>
                                <span className="text-stone-700 dark:text-stone-300 font-medium">
                                  {warning.message}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Valid Data Preview Rail */}
                  <div className="space-y-8">
                    <Card className="rounded-[2rem] p-8 shadow-2xl bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-white/5 overflow-hidden">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="font-serif font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight flex items-center gap-3 text-xl">
                            <Icons.Success className="w-6 h-6" /> Xem trước dữ liệu
                          </h3>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                            Sơ lược 10 hồ sơ đầu tiên
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-stone-100 dark:border-white/5 mb-8 overflow-hidden shadow-inner">
                        <table className="min-w-full divide-y divide-stone-100 dark:divide-white/5 text-[11px]">
                          <thead className="bg-stone-50 dark:bg-white/[0.02]">
                            <tr>
                              <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest uppercase">
                                Học sinh
                              </th>
                              <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest uppercase">
                                Email
                              </th>
                              <th className="px-6 py-4 text-left font-black text-stone-400 uppercase tracking-widest uppercase">
                                CID (Mã định danh)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-transparent divide-y divide-stone-50 dark:divide-white/5">
                            {preview.valid.slice(0, 10).map((student, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-amber-50/50 dark:hover:bg-white/[0.02] transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <p className="font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight">
                                    {student.firstName} {student.lastName}
                                  </p>
                                  <p className="text-[9px] font-black text-stone-400 uppercase mt-0.5">
                                    {student.gradeLevel || '—'}
                                  </p>
                                </td>
                                <td className="px-6 py-4 text-stone-500 font-medium">
                                  {student.email}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge
                                    variant="info"
                                    className="font-black text-[9px] h-6 px-3 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400"
                                  >
                                    {student.studentId || 'CHỜ CẤP'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Global Action Box */}
                      <div className="pt-8 border-t border-stone-100 dark:border-white/5 flex gap-4">
                        <Button
                          onClick={handleReset}
                          variant="outline"
                          fullWidth
                          disabled={importing}
                          className="font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl border-stone-200 dark:border-white/10 hover:bg-stone-50 dark:hover:bg-white/5"
                        >
                          Hủy bỏ & Làm lại
                        </Button>
                        <Button
                          onClick={handleImport}
                          variant="primary"
                          fullWidth
                          disabled={importing || preview.valid.length === 0}
                          isLoading={importing}
                          className="font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl shadow-amber-glow bg-amber-600 hover:bg-amber-500"
                        >
                          <Icons.Upload className="w-4 h-4 mr-2" />
                          Nhập {preview.validRows} học sinh
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in zoom-in-95 duration-700 max-w-3xl mx-auto">
            <Card className="border-emerald-500/10 bg-white dark:bg-stone-900 shadow-ultra p-16 text-center rounded-[3rem]">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/30 animate-bounce-slow">
                <Icons.Success className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-black text-stone-900 dark:text-stone-100 uppercase tracking-tight mb-6">
                Xử lý <span className="text-emerald-500">Thành công!</span>
              </h2>
              <p className="text-stone-500 dark:text-stone-400 font-medium mb-12 max-w-lg mx-auto leading-relaxed text-sm">
                Hệ thống đã hoàn tất xử lý tệp tin. Toàn bộ hồ sơ hợp lệ đã được tích hợp vào cơ sở
                dữ liệu học sinh của trung tâm.
              </p>

              {importResults && (
                <div className="max-w-xl mx-auto mb-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-stone-50 dark:bg-stone-950/50 rounded-3xl p-6 border border-stone-100 dark:border-white/5 shadow-inner">
                      <p className="text-3xl font-black text-stone-900 dark:text-white mb-2">
                        {importResults.total}
                      </p>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">
                        Tổng số
                      </p>
                    </div>
                    <div className="bg-emerald-50/50 dark:bg-emerald-500/[0.03] rounded-3xl p-6 border border-emerald-100 dark:border-emerald-500/10 shadow-inner">
                      <p className="text-3xl font-black text-emerald-600 mb-2">
                        {importResults.successCount}
                      </p>
                      <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em]">
                        Hợp lệ
                      </p>
                    </div>
                    <div className="bg-rose-50/50 dark:bg-rose-500/[0.03] rounded-3xl p-6 border border-rose-100 dark:border-rose-500/10 shadow-inner">
                      <p className="text-3xl font-black text-rose-500 mb-2">
                        {importResults.errorCount}
                      </p>
                      <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.2em]">
                        Có lỗi
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => router.push('/dashboard/students')}
                  variant="outline"
                  className="font-black uppercase tracking-widest text-[11px] h-14 px-10 rounded-2xl border-stone-200 dark:border-white/10"
                >
                  <Icons.Students className="w-4 h-4 mr-2" />
                  Danh sách học sinh
                </Button>
                <Button
                  onClick={handleReset}
                  variant="primary"
                  className="font-black uppercase tracking-widest text-[11px] h-14 px-10 rounded-2xl shadow-amber-glow bg-amber-600 hover:bg-amber-500"
                >
                  <Icons.Refresh className="w-4 h-4 mr-2" />
                  Tiếp tục nhập tệp mới
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCardModern({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'rose';
  icon: React.ReactNode;
}) {
  const colorMap = {
    blue: {
      card: 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-500/10 hover:border-blue-500/30',
      icon: 'bg-blue-500/10 text-blue-600',
      text: 'text-blue-600',
    },
    emerald: {
      card: 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-500/10 hover:border-emerald-500/30',
      icon: 'bg-emerald-500/10 text-emerald-600',
      text: 'text-emerald-600',
    },
    rose: {
      card: 'bg-rose-50/30 dark:bg-rose-900/10 border-rose-500/10 hover:border-rose-500/30',
      icon: 'bg-rose-500/10 text-rose-500',
      text: 'text-rose-500',
    },
  };

  const styles = colorMap[color];

  return (
    <div
      className={cn(
        'rounded-[2rem] p-8 border transition-all duration-500 shadow-lg group hover:-translate-y-1',
        styles.card
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm',
            styles.icon
          )}
        >
          {icon}
        </div>
      </div>
      <p className={cn('text-4xl font-serif font-black mb-1 tabular-nums', styles.text)}>{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 group-hover:text-stone-500 transition-colors uppercase">
        {label}
      </p>
    </div>
  );
}
