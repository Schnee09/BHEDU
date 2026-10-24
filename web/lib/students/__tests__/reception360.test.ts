import { normalizeReceptionSearch, summarizeStudentFinance } from '../reception360';

describe('Reception 360 helpers', () => {
  it('removes PostgREST control characters from search input', () => {
    expect(normalizeReceptionSearch("  An,(test)' ")).toBe('An test');
  });

  it('summarizes debt and ignores cancelled invoices', () => {
    const result = summarizeStudentFinance(
      [
        {
          total_amount: 1_000_000,
          paid_amount: 400_000,
          status: 'partial',
          due_date: '2026-01-10',
        },
        { total_amount: 500_000, paid_amount: 0, status: 'cancelled', due_date: '2026-01-01' },
        { total_amount: 250_000, paid_amount: 250_000, status: 'paid', due_date: '2026-01-05' },
      ],
      '2026-02-01'
    );

    expect(result).toEqual({
      total_due: 1_250_000,
      total_paid: 650_000,
      outstanding: 600_000,
      open_invoices: 1,
      overdue_invoices: 1,
    });
  });
});
