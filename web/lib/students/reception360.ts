export interface ReceptionInvoiceRow {
  total_amount: number | string | null;
  paid_amount: number | string | null;
  status: string | null;
  due_date: string | null;
}

export interface ReceptionFinanceSummary {
  total_due: number;
  total_paid: number;
  outstanding: number;
  open_invoices: number;
  overdue_invoices: number;
}

export function normalizeReceptionSearch(value: string): string {
  return value
    .trim()
    .replace(/[,()%"'\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
}

export function summarizeStudentFinance(
  invoices: ReceptionInvoiceRow[],
  today = new Date().toISOString().slice(0, 10)
): ReceptionFinanceSummary {
  return invoices.reduce<ReceptionFinanceSummary>(
    (summary, invoice) => {
      if (invoice.status === 'cancelled') return summary;

      const total = Number(invoice.total_amount || 0);
      const paid = Number(invoice.paid_amount || 0);
      const outstanding = Math.max(total - paid, 0);
      summary.total_due += total;
      summary.total_paid += paid;
      summary.outstanding += outstanding;

      if (outstanding > 0) {
        summary.open_invoices += 1;
        if (invoice.status === 'overdue' || Boolean(invoice.due_date && invoice.due_date < today)) {
          summary.overdue_invoices += 1;
        }
      }

      return summary;
    },
    { total_due: 0, total_paid: 0, outstanding: 0, open_invoices: 0, overdue_invoices: 0 }
  );
}
