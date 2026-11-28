interface FinanceRefundActionProps {
  canRefund: boolean;
  refundableAmount: number;
  onRefund: () => void;
}

export default function FinanceRefundAction({
  canRefund,
  refundableAmount,
  onRefund,
}: FinanceRefundActionProps) {
  if (!canRefund) {
    return (
      <span className="text-stone-400" aria-label="Không có quyền hoàn tiền">
        —
      </span>
    );
  }

  return (
    <button
      disabled={refundableAmount <= 0}
      onClick={onRefund}
      className="cursor-pointer rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-900 dark:hover:bg-rose-950/30"
    >
      {refundableAmount > 0 ? 'Hoàn tiền' : 'Đã hoàn hết'}
    </button>
  );
}
