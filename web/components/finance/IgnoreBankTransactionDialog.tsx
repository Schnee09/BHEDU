'use client';

import { useState } from 'react';
import { AlertTriangle, Ban } from 'lucide-react';
import { Button } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Transaction = {
  id: string;
  amount: number;
  transaction_at: string;
  description: string | null;
};
type Props = { transaction: Transaction | null; onClose: () => void; onSuccess: () => void };
const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`;

export default function IgnoreBankTransactionDialog(props: Props) {
  if (!props.transaction) return null;
  return <IgnoreForm key={props.transaction.id} {...props} transaction={props.transaction} />;
}

function IgnoreForm({
  transaction,
  onClose,
  onSuccess,
}: Omit<Props, 'transaction'> & { transaction: Transaction }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 3) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/finance/statements/transactions/${transaction.id}/ignore`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || 'Không thể bỏ qua giao dịch');
      onSuccess();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể bỏ qua giao dịch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-lg gap-5 p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <Ban className="h-5 w-5 text-amber-600" /> Bỏ qua giao dịch
          </DialogTitle>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Giao dịch sẽ được loại khỏi hàng chờ đối soát và không tạo phiếu thu.
          </p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-700 dark:bg-stone-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-stone-500">Giao dịch ngân hàng</p>
                <p className="mt-1 text-sm text-stone-700 dark:text-stone-300">
                  {new Date(transaction.transaction_at).toLocaleString('vi-VN')}
                </p>
              </div>
              <p className="whitespace-nowrap text-lg font-black">{money(transaction.amount)}</p>
            </div>
            <p className="mt-2 text-sm font-medium">
              {transaction.description || 'Không có nội dung chuyển khoản'}
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Chỉ bỏ qua khi đã chắc chắn giao
            dịch không phải khoản thu học phí cần xử lý.
          </div>
          <label className="block text-sm font-bold">
            Lý do bỏ qua <span className="text-red-600">*</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={3}
              maxLength={300}
              rows={3}
              placeholder="Ví dụ: Giao dịch nội bộ, hoàn tiền hoặc chuyển nhầm"
              className="mt-1.5 w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 dark:border-stone-700 dark:bg-stone-900"
              required
            />
            <span className="mt-1 block text-right text-xs font-normal text-stone-500">
              {reason.length}/300
            </span>
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
              variant="outline"
              disabled={reason.trim().length < 3 || saving}
              isLoading={saving}
              leftIcon={<Ban className="h-4 w-4" />}
              className="border-amber-300 text-amber-800 hover:bg-amber-50 focus:ring-amber-500 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
            >
              Xác nhận bỏ qua
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
