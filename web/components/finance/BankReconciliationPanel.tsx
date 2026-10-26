'use client';

import { useState } from 'react';
import { AlertCircle, Landmark, RefreshCw, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui/Card';
import { useFetch } from '@/hooks/useFetch';
import ConfirmBankTransactionDialog from './ConfirmBankTransactionDialog';
import IgnoreBankTransactionDialog from './IgnoreBankTransactionDialog';

type Transaction = {
  id: string;
  transaction_at: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string | null;
  reference_number: string | null;
  counterparty_name: string | null;
  match_status: string;
  batch: { bank_code: string | null; account_number_masked: string | null; file_name: string };
  liveSuggestion: {
    id: string;
    fullName: string;
    studentCode: string | null;
    confidence: number;
    reason: 'student_code' | 'full_name' | 'counterparty_name';
    ambiguous: boolean;
  } | null;
};

type Response = {
  data: Transaction[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

const money = (value: number) => `${Number(value).toLocaleString('vi-VN')} ₫`;
const reasonLabel = {
  student_code: 'Khớp mã học sinh',
  full_name: 'Khớp họ tên trong nội dung',
  counterparty_name: 'Khớp tên người chuyển',
};

export default function BankReconciliationPanel() {
  const [status, setStatus] = useState('unmatched');
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [ignoredTransaction, setIgnoredTransaction] = useState<Transaction | null>(null);
  const { data, loading, error, refetch } = useFetch<Response>(
    `/api/admin/finance/statements/transactions?status=${status}&page=${page}&limit=25`
  );
  const rows = data?.data || [];
  const pagination = data?.pagination || { page: 1, pageSize: 25, total: 0, totalPages: 1 };

  return (
    <div className="space-y-5 animate-fadeIn">
      <ConfirmBankTransactionDialog
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onSuccess={refetch}
      />
      <IgnoreBankTransactionDialog
        transaction={ignoredTransaction}
        onClose={() => setIgnoredTransaction(null)}
        onSuccess={refetch}
      />
      <Card className="glass-crystal rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-stone-900 dark:text-white">
              <Landmark className="h-5 w-5 text-emerald-600" /> Giao dịch cần đối soát
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Gợi ý chỉ hỗ trợ tra cứu. Hãy kiểm tra đúng học sinh và khoản cần thu trước khi xác
              nhận.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="reconciliation-status">
              Lọc trạng thái đối soát
            </label>
            <select
              id="reconciliation-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="min-h-11 cursor-pointer rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 dark:border-stone-700 dark:bg-stone-900"
            >
              <option value="unmatched">Chưa đối soát</option>
              <option value="needs_review">Cần xem lại</option>
              <option value="suggested">Đã có gợi ý</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="ignored">Đã bỏ qua</option>
              <option value="all">Tất cả</option>
            </select>
            <Button variant="outline" size="sm" onClick={refetch} aria-label="Tải lại danh sách">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Tải lại</span>
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      <Card className="glass-crystal overflow-hidden rounded-3xl p-0">
        {loading && !data ? (
          <div className="p-10 text-center text-sm text-stone-500">Đang tải giao dịch...</div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <SearchCheck className="mb-3 h-10 w-10 text-emerald-600" />
            <p className="font-bold text-stone-900 dark:text-white">
              Không có giao dịch trong nhóm này
            </p>
            <p className="mt-1 text-sm text-stone-500">
              Bạn có thể chọn trạng thái khác hoặc nhập thêm sao kê.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-stone-100 md:hidden dark:divide-stone-800">
              {rows.map((row) => (
                <TransactionCard
                  key={row.id}
                  row={row}
                  onConfirm={setSelectedTransaction}
                  onIgnore={setIgnoredTransaction}
                />
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                  <tr>
                    <th className="px-5 py-3">Giao dịch</th>
                    <th className="px-5 py-3">Nội dung</th>
                    <th className="px-5 py-3 text-right">Số tiền</th>
                    <th className="px-5 py-3">Gợi ý học sinh</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-white transition-colors hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold">
                          {new Date(row.transaction_at).toLocaleString('vi-VN')}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {row.batch.bank_code || 'Chưa rõ ngân hàng'} ·{' '}
                          {row.reference_number || 'Không có mã GD'}
                        </p>
                      </td>
                      <td className="max-w-sm px-5 py-4">
                        <p className="line-clamp-2 font-medium">
                          {row.description || 'Không có nội dung'}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {row.counterparty_name || 'Không có tên người chuyển'}
                        </p>
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-4 text-right font-black ${row.direction === 'credit' ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-600 dark:text-stone-400'}`}
                      >
                        {money(row.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <Suggestion row={row} />
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.match_status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canConfirm(row) && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setIgnoredTransaction(row)}
                            >
                              Bỏ qua
                            </Button>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => setSelectedTransaction(row)}
                            >
                              Xác nhận khoản thu
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-200 px-5 py-4 dark:border-stone-700">
            <span className="text-xs text-stone-600 dark:text-stone-400">
              {pagination.total} giao dịch · Trang {pagination.page}/{pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Suggestion({ row }: { row: Transaction }) {
  const suggestion = row.liveSuggestion;
  if (!suggestion) return <span className="text-sm text-stone-500">Chưa tìm thấy</span>;
  return (
    <div>
      <p className="font-bold text-stone-900 dark:text-white">{suggestion.fullName}</p>
      <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
        {suggestion.studentCode || 'Chưa có mã'} · {Math.round(suggestion.confidence * 100)}%
      </p>
      <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
        {suggestion.ambiguous ? 'Có nhiều kết quả tương tự' : reasonLabel[suggestion.reason]}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    unmatched: 'Chưa đối soát',
    suggested: 'Đã có gợi ý',
    confirmed: 'Đã xác nhận',
    ignored: 'Đã bỏ qua',
    needs_review: 'Cần xem lại',
  };
  return (
    <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 dark:bg-stone-800 dark:text-stone-300">
      {labels[status] || status}
    </span>
  );
}

function canConfirm(row: Transaction) {
  return (
    row.direction === 'credit' &&
    ['unmatched', 'suggested', 'needs_review'].includes(row.match_status)
  );
}

function TransactionCard({
  row,
  onConfirm,
  onIgnore,
}: {
  row: Transaction;
  onConfirm: (row: Transaction) => void;
  onIgnore: (row: Transaction) => void;
}) {
  return (
    <article className="space-y-3 bg-white p-4 dark:bg-stone-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">
            {new Date(row.transaction_at).toLocaleString('vi-VN')}
          </p>
          <p className="text-xs text-stone-500">{row.batch.bank_code || 'Chưa rõ ngân hàng'}</p>
        </div>
        <p className="whitespace-nowrap font-black text-emerald-700 dark:text-emerald-400">
          {money(row.amount)}
        </p>
      </div>
      <p className="text-sm text-stone-800 dark:text-stone-200">
        {row.description || 'Không có nội dung'}
      </p>
      <div className="grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-3 dark:bg-stone-900">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-stone-500">Gợi ý học sinh</p>
          <Suggestion row={row} />
        </div>
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase text-stone-500">Trạng thái</p>
          <StatusBadge status={row.match_status} />
        </div>
      </div>
      {canConfirm(row) && (
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="ghost" onClick={() => onIgnore(row)}>
            Bỏ qua
          </Button>
          <Button size="sm" variant="success" onClick={() => onConfirm(row)}>
            Xác nhận khoản thu
          </Button>
        </div>
      )}
    </article>
  );
}
