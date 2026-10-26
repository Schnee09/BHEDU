'use client';

import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui';

type PreviewRow = {
  rowNumber: number;
  transactionAt: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string | null;
  referenceNumber: string | null;
  duplicate: boolean;
  duplicateSource: 'file' | 'system' | null;
  warnings: string[];
};

type Preview = {
  fileName: string;
  rows: PreviewRow[];
  errors: Array<{ rowNumber: number; message: string }>;
  summary: {
    totalRows: number;
    validRows: number;
    duplicateRows: number;
    invalidRows: number;
    creditRows: number;
  };
};

type Props = { open: boolean; onClose: () => void; onSuccess: () => void };
const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

export default function BankStatementImportDialog({ open, onClose, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [bankCode, setBankCode] = useState('');
  const [accountScope, setAccountScope] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<'preview' | 'import' | null>(null);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const reset = () => {
    setFile(null);
    setBankCode('');
    setAccountScope('');
    setPreview(null);
    setBusy(null);
    setMessage(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };
  const formData = () => {
    const data = new FormData();
    if (file) data.append('file', file);
    data.append('bank_code', bankCode);
    data.append('account_scope', accountScope);
    return data;
  };

  const loadPreview = async () => {
    if (!file) return;
    setBusy('preview');
    setMessage(null);
    try {
      const response = await fetch('/api/admin/finance/statements/preview', {
        method: 'POST',
        body: formData(),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Không thể đọc sao kê');
      setPreview(result.data);
    } catch (error) {
      setPreview(null);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể đọc sao kê',
      });
    } finally {
      setBusy(null);
    }
  };

  const confirmImport = async () => {
    if (!file || !preview || preview.summary.invalidRows > 0) return;
    setBusy('import');
    setMessage(null);
    try {
      const response = await fetch('/api/admin/finance/statements/import', {
        method: 'POST',
        body: formData(),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Không thể nhập sao kê');
      setMessage({
        type: 'success',
        text: `Đã nhập ${result.data.importedRows} giao dịch; bỏ qua ${result.data.duplicateRows} giao dịch trùng.`,
      });
      onSuccess();
      setPreview(null);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Không thể nhập sao kê',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && close()}>
      <DialogContent className="max-w-5xl gap-5 p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-stone-900 dark:text-white">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Nhập sao kê ngân hàng
          </DialogTitle>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Kiểm tra giao dịch trước khi đưa vào danh sách đối soát. Bước này chưa tự ghi nhận học
            phí.
          </p>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px_220px]">
          <label className="group flex min-h-24 cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 focus-within:ring-2 focus-within:ring-emerald-500 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-emerald-950/20">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx"
              className="sr-only"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
                setMessage(null);
              }}
            />
            <span className="rounded-xl bg-white p-2.5 text-emerald-700 shadow-sm dark:bg-stone-800 dark:text-emerald-400">
              <Upload className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-stone-900 dark:text-white">
                {file?.name || 'Chọn file sao kê'}
              </span>
              <span className="text-xs text-stone-500">CSV hoặc XLSX, tối đa 5 MB</span>
            </span>
          </label>
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
            Ngân hàng
            <input
              value={bankCode}
              onChange={(event) => {
                setBankCode(event.target.value);
                setPreview(null);
              }}
              placeholder="Ví dụ: VCB"
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-900"
            />
          </label>
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
            Tài khoản nhận tiền
            <input
              value={accountScope}
              onChange={(event) => {
                setAccountScope(event.target.value);
                setPreview(null);
              }}
              placeholder="Chỉ nhập 4 số cuối"
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-stone-700 dark:bg-stone-900"
            />
            <span className="mt-1 block font-normal text-stone-500">
              Không nhập đầy đủ số tài khoản.
            </span>
          </label>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${message.type === 'error' ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'}`}
            role="status"
          >
            {message.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['Tổng số dòng', preview.summary.totalRows, 'text-stone-900 dark:text-white'],
                [
                  'Có thể nhập',
                  preview.summary.validRows,
                  'text-emerald-700 dark:text-emerald-400',
                ],
                [
                  'Trùng dữ liệu',
                  preview.summary.duplicateRows,
                  'text-amber-700 dark:text-amber-400',
                ],
                ['Cần sửa', preview.summary.invalidRows, 'text-red-700 dark:text-red-400'],
              ].map(([label, value, color]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-stone-700 dark:bg-stone-900"
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">
                    {label}
                  </p>
                  <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {preview.errors.length > 0 && (
              <div className="max-h-28 overflow-y-auto rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                <p className="mb-1 font-bold">Các dòng cần sửa trong file</p>
                {preview.errors.map((error) => (
                  <p key={`${error.rowNumber}-${error.message}`}>
                    Dòng {error.rowNumber}: {error.message}
                  </p>
                ))}
              </div>
            )}

            <div className="max-h-[38vh] overflow-auto rounded-2xl border border-stone-200 dark:border-stone-700">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-stone-100 text-xs uppercase text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  <tr>
                    <th className="px-3 py-2.5">Dòng</th>
                    <th className="px-3 py-2.5">Thời gian</th>
                    <th className="px-3 py-2.5 text-right">Số tiền</th>
                    <th className="px-3 py-2.5">Nội dung</th>
                    <th className="px-3 py-2.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {preview.rows.map((row) => (
                    <tr
                      key={`${row.rowNumber}-${row.referenceNumber}`}
                      className="bg-white dark:bg-stone-950"
                    >
                      <td className="px-3 py-2.5 text-stone-500">{row.rowNumber}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {new Date(row.transactionAt).toLocaleString('vi-VN')}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2.5 text-right font-bold ${row.direction === 'credit' ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-600 dark:text-stone-400'}`}
                      >
                        {money(row.amount)}
                      </td>
                      <td className="max-w-xs px-3 py-2.5">
                        <span className="line-clamp-2">{row.description || '—'}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {row.duplicate ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Đã tồn tại
                          </span>
                        ) : row.direction === 'debit' ? (
                          <span className="rounded-full bg-stone-100 px-2 py-1 text-xs font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                            Ghi nợ
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Sẵn sàng
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-4 sm:flex-row sm:justify-between dark:border-stone-700">
          <Button type="button" variant="ghost" onClick={close} disabled={Boolean(busy)}>
            Đóng
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={loadPreview}
              disabled={!file || Boolean(busy)}
              leftIcon={
                busy === 'preview' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : preview ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )
              }
            >
              {preview ? 'Kiểm tra lại' : 'Kiểm tra file'}
            </Button>
            <Button
              type="button"
              variant="success"
              onClick={confirmImport}
              disabled={
                !preview ||
                preview.summary.invalidRows > 0 ||
                preview.summary.validRows === 0 ||
                Boolean(busy)
              }
              leftIcon={
                busy === 'import' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )
              }
            >
              Xác nhận nhập
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
