'use client';

import { AlertCircle, ArrowRight, CircleDollarSign, FileWarning, Landmark } from 'lucide-react';
import { useFetch } from '@/hooks/useFetch';

type Summary = {
  totalTasks: number;
  bankTransactions: number;
  bankNeedsReview: number;
  unallocatedPayments: number;
  unallocatedAmount: number;
  overdueInvoices: number;
  overdueAmount: number;
  failedImports: number;
};

type Props = {
  academicYearId: string;
  onOpenReconciliation: () => void;
  onOpenPayments: () => void;
  onOpenInvoices: () => void;
};

const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

export default function FinanceWorkQueue({
  academicYearId,
  onOpenReconciliation,
  onOpenPayments,
  onOpenInvoices,
}: Props) {
  const { data, loading, error } = useFetch<Summary>(
    academicYearId ? `/api/admin/finance/work-queue?academic_year_id=${academicYearId}` : null
  );

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
        <AlertCircle className="h-5 w-5" /> Không thể tải danh sách việc cần xử lý.
      </div>
    );
  }

  const summary = data || {
    totalTasks: 0,
    bankTransactions: 0,
    bankNeedsReview: 0,
    unallocatedPayments: 0,
    unallocatedAmount: 0,
    overdueInvoices: 0,
    overdueAmount: 0,
    failedImports: 0,
  };
  const tasks = [
    {
      title: 'Đối soát ngân hàng',
      count: summary.bankTransactions + summary.bankNeedsReview,
      detail: `${summary.bankNeedsReview} giao dịch cần xem kỹ`,
      icon: Landmark,
      tone: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-900',
      action: onOpenReconciliation,
    },
    {
      title: 'Tiền chưa phân bổ',
      count: summary.unallocatedPayments,
      detail: money(summary.unallocatedAmount),
      icon: CircleDollarSign,
      tone: 'text-amber-800 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900',
      action: onOpenPayments,
    },
    {
      title: 'Khoản thu quá hạn',
      count: summary.overdueInvoices,
      detail: money(summary.overdueAmount),
      icon: FileWarning,
      tone: 'text-red-800 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900',
      action: onOpenInvoices,
    },
  ];

  return (
    <section aria-labelledby="finance-work-queue-title" className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="finance-work-queue-title"
            className="text-xl font-black text-stone-900 dark:text-white"
          >
            Cần xử lý
          </h2>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Những việc đang ảnh hưởng đến đối soát và công nợ của trung tâm.
          </p>
        </div>
        <span className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-white dark:text-stone-900">
          {loading ? 'Đang tải' : `${summary.totalTasks} việc`}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <button
              key={task.title}
              type="button"
              onClick={task.action}
              className={`group min-h-32 cursor-pointer rounded-2xl border p-4 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${task.tone}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-xl bg-white/80 p-2 dark:bg-black/20">
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 text-sm font-bold">{task.title}</p>
              <div className="mt-1 flex items-baseline justify-between gap-3">
                <span className="text-2xl font-black">{task.count}</span>
                <span className="text-xs font-semibold opacity-80">{task.detail}</span>
              </div>
            </button>
          );
        })}
      </div>
      {summary.failedImports > 0 && (
        <p className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4" /> {summary.failedImports} lần nhập sao kê thất bại cần
          kiểm tra.
        </p>
      )}
    </section>
  );
}
