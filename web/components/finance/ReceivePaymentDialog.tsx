'use client';

import { useMemo, useState } from 'react';
import { Banknote, Search, WandSparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFetch } from '@/hooks/useFetch';

type Invoice = {
  id: string;
  invoice_number: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  student: { id: string; full_name: string; student_code: string | null };
};

type Props = {
  open: boolean;
  academicYearId: string;
  paymentMethods: Array<{ id: string; name: string; type: string }>;
  onClose: () => void;
  onSuccess: () => void;
};

const money = (value: number) => `${value.toLocaleString('vi-VN')} ₫`;

export default function ReceivePaymentDialog({
  open,
  academicYearId,
  paymentMethods,
  onClose,
  onSuccess,
}: Props) {
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const query = new URLSearchParams({
    academic_year_id: academicYearId,
    limit: '100',
    ...(search.trim() && { search: search.trim() }),
  });
  const { data } = useFetch<{ data: Invoice[] }>(
    open && academicYearId ? `/api/admin/finance/invoices?${query}` : ''
  );
  const openInvoices = (data?.data || []).filter(
    (invoice) => invoice.status !== 'paid' && invoice.status !== 'cancelled'
  );
  const students = useMemo(() => {
    const unique = new Map<string, Invoice['student']>();
    openInvoices.forEach((invoice) => unique.set(invoice.student.id, invoice.student));
    return [...unique.values()];
  }, [openInvoices]);
  const studentInvoices = openInvoices.filter((invoice) => invoice.student.id === studentId);
  const received = Number(amount) || 0;
  const allocated = Object.values(allocations).reduce((sum, value) => sum + value, 0);

  const autoAllocate = () => {
    let remaining = received;
    const next: Record<string, number> = {};
    [...studentInvoices]
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .forEach((invoice) => {
        const outstanding = Number(invoice.total_amount) - Number(invoice.paid_amount);
        const value = Math.min(remaining, outstanding);
        if (value > 0) next[invoice.id] = value;
        remaining -= value;
      });
    setAllocations(next);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!studentId || received <= 0 || !methodId || allocated > received) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          amount: received,
          payment_method_id: methodId,
          reference_number: reference || null,
          notes: notes || null,
          allocations: Object.entries(allocations)
            .filter(([, value]) => value > 0)
            .map(([invoice_id, value]) => ({ invoice_id, amount: value })),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Không thể ghi nhận');
      onSuccess();
      onClose();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể ghi nhận khoản thu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl gap-5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black text-stone-900 dark:text-white">
            <Banknote className="h-5 w-5 text-emerald-600" /> Ghi nhận khoản thu
          </DialogTitle>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Ghi nhận tiền đã nhận và phân bổ cho một hoặc nhiều khoản còn thiếu.
          </p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-stone-700 dark:text-stone-300">
              Tìm học sinh
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tên hoặc mã học sinh"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-3 text-sm dark:border-stone-700 dark:bg-stone-900"
              />
            </div>
            <select
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setAllocations({});
              }}
              className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900"
              required
            >
              <option value="">Chọn học sinh có khoản cần thu</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} {student.student_code ? `— ${student.student_code}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Số tiền đã nhận
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-base font-bold dark:border-stone-700 dark:bg-stone-900"
                required
              />
            </label>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
              Hình thức thanh toán
              <select
                value={methodId}
                onChange={(e) => setMethodId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900"
                required
              >
                <option value="">Chọn hình thức</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {studentId && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between border-b border-stone-200 p-3 dark:border-stone-700">
                <span className="text-sm font-bold">Phân bổ khoản thu</span>
                <button
                  type="button"
                  onClick={autoAllocate}
                  disabled={received <= 0}
                  className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-emerald-700 disabled:opacity-40 dark:text-emerald-400"
                >
                  <WandSparkles className="h-3.5 w-3.5" /> Tự phân bổ khoản cũ trước
                </button>
              </div>
              <div className="max-h-56 divide-y divide-stone-100 overflow-y-auto dark:divide-stone-800">
                {studentInvoices.map((invoice) => {
                  const outstanding = Number(invoice.total_amount) - Number(invoice.paid_amount);
                  return (
                    <label
                      key={invoice.id}
                      className="grid grid-cols-[1fr_140px] items-center gap-3 p-3"
                    >
                      <span>
                        <span className="block text-sm font-bold">{invoice.invoice_number}</span>
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
                          setAllocations((prev) => ({
                            ...prev,
                            [invoice.id]: Number(e.target.value) || 0,
                          }))
                        }
                        className="rounded-lg border border-stone-200 px-2.5 py-2 text-right text-sm font-bold dark:border-stone-700 dark:bg-stone-900"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-stone-100 p-3 text-center dark:bg-stone-900">
            <div>
              <p className="text-[10px] uppercase text-stone-500">Đã nhận</p>
              <p className="text-sm font-black">{money(received)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-stone-500">Phân bổ</p>
              <p className="text-sm font-black text-emerald-600">{money(allocated)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-stone-500">Còn lại</p>
              <p className="text-sm font-black text-amber-600">{money(received - allocated)}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Mã giao dịch (nếu có)"
              className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900"
            />
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú"
              className="rounded-xl border border-stone-200 px-3 py-2.5 text-sm dark:border-stone-700 dark:bg-stone-900"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-bold dark:border-stone-700"
            >
              Đóng
            </button>
            <button
              disabled={saving || allocated > received}
              className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Đang ghi nhận...' : 'Xác nhận khoản thu'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
