'use client';

import { useState } from 'react';
import { Banknote, Search, ShieldCheck, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFetch } from '@/hooks/useFetch';

type Transaction = {
  id: string;
  amount: number;
  transaction_at: string;
  description: string | null;
  liveSuggestion: {
    id: string;
    fullName: string;
    studentCode: string | null;
    confidence: number;
    ambiguous: boolean;
  } | null;
};
type Student = { id: string; full_name: string; student_code: string | null };
type Invoice = {
  id: string;
  invoice_number: string;
  billing_period: string | null;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
};
type Context = { transaction: Transaction; students: Student[]; invoices: Invoice[] };
type Method = { id: string; name: string; type: string };
type Props = { transaction: Transaction | null; onClose: () => void; onSuccess: () => void };
const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`;

export default function ConfirmBankTransactionDialog({ transaction, onClose, onSuccess }: Props) {
  if (!transaction) return null;
  return (
    <ConfirmBankTransactionForm
      key={transaction.id}
      transaction={transaction}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function ConfirmBankTransactionForm({
  transaction,
  onClose,
  onSuccess,
}: Omit<Props, 'transaction'> & { transaction: Transaction }) {
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentId, setStudentId] = useState(
    transaction.liveSuggestion?.ambiguous ? '' : transaction.liveSuggestion?.id || ''
  );
  const [methodId, setMethodId] = useState('');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const query = new URLSearchParams({
    ...(studentId ? { student_id: studentId } : {}),
    ...(!studentId && searchQuery ? { search: searchQuery } : {}),
  });
  const { data: context } = useFetch<Context>(
    `/api/admin/finance/statements/transactions/${transaction.id}/context?${query}`
  );
  const { data: methodResponse } = useFetch<{ data: Method[] }>(
    '/api/admin/finance/payment-methods'
  );
  const methods = methodResponse?.data || [];
  const students = context?.students || [];
  const invoices = context?.invoices || [];
  const allocated = Object.values(allocations).reduce((sum, value) => sum + value, 0);
  const amount = Number(transaction?.amount || 0);

  const autoAllocate = () => {
    let remaining = amount;
    const next: Record<string, number> = {};
    invoices.forEach((invoice) => {
      const outstanding = Number(invoice.total_amount) - Number(invoice.paid_amount);
      const value = Math.min(remaining, outstanding);
      if (value > 0) next[invoice.id] = value;
      remaining -= value;
    });
    setAllocations(next);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transaction || !studentId || !methodId || allocated > amount) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/finance/statements/transactions/${transaction.id}/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: studentId,
            payment_method_id: methodId,
            allocations: Object.entries(allocations)
              .filter(([, value]) => value > 0)
              .map(([invoice_id, value]) => ({ invoice_id, amount: value })),
            notes: notes || null,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || 'Không thể xác nhận khoản thu');
      onSuccess();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể xác nhận khoản thu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(transaction)} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-3xl gap-5 p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <ShieldCheck className="h-5 w-5 text-emerald-600" /> Xác nhận khoản thu ngân hàng
          </DialogTitle>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Kiểm tra kỹ học sinh trước khi tạo phiếu thu. Thao tác xác nhận chỉ thực hiện một lần.
          </p>
        </DialogHeader>
        {transaction && (
          <form onSubmit={submit} className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                    Tiền vào ngân hàng
                  </p>
                  <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
                    {new Date(transaction.transaction_at).toLocaleString('vi-VN')}
                  </p>
                </div>
                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {money(amount)}
                </p>
              </div>
              <p className="mt-2 text-sm font-medium">
                {transaction.description || 'Không có nội dung chuyển khoản'}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-stone-700 dark:text-stone-300">
                Tìm và chọn học sinh
              </label>
              {!studentId && (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      placeholder="Tên hoặc mã học sinh"
                      className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm dark:border-stone-700 dark:bg-stone-900"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSearchQuery(searchText.trim())}
                  >
                    Tìm
                  </Button>
                </div>
              )}
              <select
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setAllocations({});
                }}
                className="mt-2 min-h-11 w-full cursor-pointer rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-stone-700 dark:bg-stone-900"
                required
              >
                <option value="">Chọn học sinh</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                    {student.student_code ? ` — ${student.student_code}` : ''}
                  </option>
                ))}
              </select>
              {studentId && (
                <button
                  type="button"
                  onClick={() => {
                    setStudentId('');
                    setAllocations({});
                  }}
                  className="mt-2 cursor-pointer text-xs font-bold text-blue-700 hover:underline dark:text-blue-400"
                >
                  Chọn học sinh khác
                </button>
              )}
            </div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              Hình thức thanh toán
              <select
                value={methodId}
                onChange={(e) => setMethodId(e.target.value)}
                className="mt-1.5 min-h-11 w-full cursor-pointer rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-stone-700 dark:bg-stone-900"
                required
              >
                <option value="">Chọn hình thức</option>
                {methods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </label>
            {studentId && (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-700">
                <div className="flex items-center justify-between gap-3 border-b border-stone-200 p-3 dark:border-stone-700">
                  <div>
                    <p className="text-sm font-bold">Phân bổ cho hóa đơn</p>
                    <p className="text-xs text-stone-500">Có thể để lại một phần chưa phân bổ.</p>
                  </div>
                  <button
                    type="button"
                    onClick={autoAllocate}
                    disabled={!invoices.length}
                    className="flex min-h-11 cursor-pointer items-center gap-1.5 text-xs font-bold text-emerald-700 disabled:opacity-40 dark:text-emerald-400"
                  >
                    <WandSparkles className="h-4 w-4" /> Tự phân bổ
                  </button>
                </div>
                <div className="max-h-52 divide-y divide-stone-100 overflow-y-auto dark:divide-stone-800">
                  {invoices.length ? (
                    invoices.map((invoice) => {
                      const outstanding =
                        Number(invoice.total_amount) - Number(invoice.paid_amount);
                      return (
                        <label
                          key={invoice.id}
                          className="grid grid-cols-[1fr_140px] items-center gap-3 p-3"
                        >
                          <span>
                            <span className="block text-sm font-bold">
                              {invoice.invoice_number}
                            </span>
                            <span className="text-xs text-stone-500">
                              Còn thiếu {money(outstanding)}
                            </span>
                          </span>
                          <input
                            aria-label={`Phân bổ cho ${invoice.invoice_number}`}
                            type="number"
                            min="0"
                            max={outstanding}
                            value={allocations[invoice.id] || ''}
                            onChange={(e) =>
                              setAllocations((previous) => ({
                                ...previous,
                                [invoice.id]: Number(e.target.value) || 0,
                              }))
                            }
                            className="rounded-lg border border-stone-200 px-2.5 py-2 text-right text-sm font-bold dark:border-stone-700 dark:bg-stone-900"
                          />
                        </label>
                      );
                    })
                  ) : (
                    <p className="p-4 text-center text-sm text-stone-500">
                      Học sinh không có hóa đơn còn thiếu.
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-stone-100 p-3 text-center dark:bg-stone-900">
              <div>
                <p className="text-[10px] uppercase text-stone-500">Tiền vào</p>
                <p className="text-sm font-black">{money(amount)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-stone-500">Phân bổ</p>
                <p className="text-sm font-black text-emerald-700">{money(allocated)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-stone-500">Chưa phân bổ</p>
                <p className="text-sm font-black text-amber-700">{money(amount - allocated)}</p>
              </div>
            </div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              Ghi chú
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                placeholder="Thông tin đã kiểm tra (nếu có)"
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900"
              />
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
              >
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 border-t border-stone-200 pt-4 sm:flex-row sm:justify-end dark:border-stone-700">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                Hủy
              </Button>
              <Button
                type="submit"
                variant="success"
                disabled={!studentId || !methodId || allocated > amount || saving}
                isLoading={saving}
                leftIcon={<Banknote className="h-4 w-4" />}
              >
                Xác nhận và tạo phiếu thu
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
