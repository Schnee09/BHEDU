'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { apiFetch } from '@/lib/api/client';

interface UserImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedUserRow {
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  student_code?: string;
  teacher_code?: string;
  grade_level?: string;
  department?: string;
  isValid: boolean;
  error?: string;
}

export function UserImportModal({ isOpen, onClose, onSuccess }: UserImportModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUserRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(
        'Ho_va_ten,Email,Vai_tro,So_dien_thoai,Ma_dinh_danh,Khoi_lop_hoac_Bo_mon\n' +
          'Nguyen Van A,nguyenvana@bhedu.vn,student,0912345678,HS2025001,Lop 10\n' +
          'Tran Thi B,tranthib@bhedu.vn,teacher,0987654321,GV2025001,To Toan\n' +
          'Le Van C,levanc@gmail.com,parent,0901234567,,\n'
      );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', 'BH_EDU_User_Import_Template.csv');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Đã tải', 'File mẫu CSV đã được tải xuống.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
      toast.error('Định dạng chưa hỗ trợ', 'Vui lòng chọn file định dạng .CSV');
      return;
    }

    setFile(selectedFile);
    setParsing(true);
    setImportResults(null);

    try {
      const text = await selectedFile.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

      if (lines.length <= 1) {
        toast.error('File rỗng', 'File không chứa dòng dữ liệu nào ngoài tiêu đề.');
        setParsedRows([]);
        return;
      }

      // Skip header
      const dataRows = lines.slice(1);
      const parsed: ParsedUserRow[] = dataRows.map((line) => {
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        const [full_name, email, role, phone, code, unit] = parts;

        const isValid = !!(full_name && email && email.includes('@') && role);
        let error = '';
        if (!full_name) error = 'Thiếu họ tên';
        else if (!email || !email.includes('@')) error = 'Email không hợp lệ';
        else if (!role) error = 'Thiếu vai trò';

        return {
          full_name: full_name || '',
          email: email || '',
          role: role?.toLowerCase() || 'student',
          phone: phone || '',
          student_code: role === 'student' ? code : undefined,
          teacher_code: role === 'teacher' || role === 'tutor' ? code : undefined,
          grade_level: role === 'student' ? unit : undefined,
          department: role === 'teacher' || role === 'tutor' || role === 'admin' ? unit : undefined,
          isValid,
          error,
        };
      });

      setParsedRows(parsed);
      toast.info('Đã đọc file', `Phát hiện ${parsed.length} dòng dữ liệu.`);
    } catch (err: any) {
      toast.error('Lỗi đọc file', err.message || 'Không thể đọc nội dung file');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('Không có dữ liệu hợp lệ', 'Vui lòng kiểm tra lại các dòng bị lỗi trước khi nhập.');
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const row of validRows) {
        try {
          const res = await apiFetch('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({
              full_name: row.full_name,
              email: row.email,
              role: row.role,
              phone: row.phone || undefined,
              student_code: row.student_code,
              teacher_code: row.teacher_code,
              grade_level: row.grade_level,
              department: row.department,
              password: 'TempPassword123!', // default temporary password
            }),
          });
          const resData = await res.json();
          if (res.ok && resData.success) {
            successCount++;
          } else {
            failCount++;
            row.isValid = false;
            row.error = resData.error || 'Lỗi tạo tài khoản';
          }
        } catch (e: any) {
          failCount++;
          row.isValid = false;
          row.error = e.message || 'Lỗi kết nối';
        }
      }

      setImportResults({ success: successCount, failed: failCount });
      if (successCount > 0) {
        toast.success('Nhập thành công', `Đã tạo ${successCount} tài khoản người dùng.`);
        onSuccess();
      } else {
        toast.error('Thất bại', 'Không thể tạo tài khoản nào từ danh sách.');
      }
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-[#14120E] border-2 border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#181612] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-stone-100">
                Nhập danh sách người dùng
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Tải lên file danh sách dạng CSV hoặc Excel để tạo tài khoản hàng loạt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Template Download Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-bold text-xs text-amber-950 dark:text-amber-200">
                  Tải file mẫu chuẩn định dạng
                </p>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400 mt-0.5">
                  Bao gồm các cột: Họ và tên, Email, Vai trò, SĐT, Mã định danh, Khối/Bộ môn.
                </p>
              </div>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2',
              file
                ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/10'
                : 'border-stone-300 dark:border-stone-700 hover:border-amber-500 hover:bg-stone-50 dark:hover:bg-[#181612]'
            )}
          >
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
              <UploadCloud className="w-6 h-6 text-amber-500" />
            </div>

            <p className="font-bold text-xs text-stone-800 dark:text-stone-200">
              {file ? file.name : 'Click để chọn hoặc kéo thả file CSV vào đây'}
            </p>
            <p className="text-[11px] text-stone-400">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Dung lượng tối đa: 5MB'}
            </p>
          </div>

          {/* Parsing state */}
          {parsing && (
            <div className="py-6 flex items-center justify-center gap-2 text-xs font-bold text-stone-500">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span>Đang phân tích cấu trúc file...</span>
            </div>
          )}

          {/* Preview rows */}
          {parsedRows.length > 0 && !parsing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  Xem trước dữ liệu ({parsedRows.length} dòng)
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validCount} hợp lệ
                  </span>
                  {invalidCount > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {invalidCount} lỗi
                    </span>
                  )}
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-stone-200 dark:border-stone-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-100 dark:bg-stone-800/80 text-[10px] font-bold uppercase text-stone-500">
                      <th className="p-2">Họ và tên</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Vai trò</th>
                      <th className="p-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {parsedRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-stone-50 dark:hover:bg-[#181612]">
                        <td className="p-2 font-bold text-stone-900 dark:text-stone-100">
                          {row.full_name || '—'}
                        </td>
                        <td className="p-2 text-stone-500 dark:text-stone-400">{row.email || '—'}</td>
                        <td className="p-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                            {row.role}
                          </span>
                        </td>
                        <td className="p-2">
                          {row.isValid ? (
                            <span className="text-emerald-600 text-[10px] font-bold">Hợp lệ</span>
                          ) : (
                            <span className="text-rose-600 text-[10px] font-bold">
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 10 && (
                <p className="text-[10px] text-stone-400 text-center italic">
                  Hiển thị 10/{parsedRows.length} dòng xem trước
                </p>
              )}
            </div>
          )}

          {/* Import result notice */}
          {importResults && (
            <div className="p-4 rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
              <p className="font-bold text-stone-900 dark:text-white">Kết quả nhập dữ liệu:</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Tạo thành công: {importResults.success} tài khoản
              </p>
              {importResults.failed > 0 && (
                <p className="text-rose-600 dark:text-rose-400 font-bold">
                  ✗ Thất bại: {importResults.failed} tài khoản
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-[#181612] flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-4 py-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {parsedRows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{importing ? 'Đang nhập...' : `Tạo ${validCount} tài khoản`}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
