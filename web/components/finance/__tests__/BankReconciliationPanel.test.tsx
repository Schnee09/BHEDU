import { render, screen } from '@testing-library/react';
import BankReconciliationPanel from '@/components/finance/BankReconciliationPanel';
import { useFetch } from '@/hooks/useFetch';

jest.mock('@/hooks/useFetch', () => ({ useFetch: jest.fn() }));
jest.mock('@/components/finance/ConfirmBankTransactionDialog', () => () => null);
jest.mock('@/components/finance/IgnoreBankTransactionDialog', () => () => null);

const response = {
  data: [
    {
      id: 'transaction-1',
      transaction_at: '2026-11-28T08:00:00.000Z',
      amount: 500_000,
      direction: 'credit',
      description: 'HP HS001 NGUYEN VAN AN',
      reference_number: 'FT123',
      counterparty_name: 'NGUYEN VAN AN',
      match_status: 'suggested',
      batch: { bank_code: 'VCB', account_number_masked: '****1234', file_name: 'statement.csv' },
      liveSuggestion: {
        id: 'student-1',
        fullName: 'Nguyễn Văn An',
        studentCode: 'HS001',
        confidence: 0.95,
        reason: 'student_code',
        ambiguous: false,
      },
    },
  ],
  pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
};

describe('BankReconciliationPanel permissions', () => {
  beforeEach(() => {
    jest.mocked(useFetch).mockReturnValue({
      data: response,
      loading: false,
      error: null,
      refetch: jest.fn(),
      setData: jest.fn(),
    } as unknown as ReturnType<typeof useFetch>);
  });

  it('keeps transactions visible without exposing mutation actions in read-only mode', () => {
    render(<BankReconciliationPanel canManage={false} />);

    expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Bỏ qua' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Xác nhận khoản thu' })).not.toBeInTheDocument();
  });

  it('shows reconciliation actions with finance.manage', () => {
    render(<BankReconciliationPanel canManage />);

    expect(screen.getAllByRole('button', { name: 'Bỏ qua' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Xác nhận khoản thu' }).length).toBeGreaterThan(0);
  });
});
