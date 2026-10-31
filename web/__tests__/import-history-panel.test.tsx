import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ImportHistoryPanel from '@/components/ImportHistoryPanel';
import { apiFetch } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({ apiFetch: jest.fn() }));
jest.mock('@/components/ToastProvider', () => ({
  showToast: { error: jest.fn() },
}));

describe('ImportHistoryPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders import records as accessible buttons and loads their errors', async () => {
    (apiFetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          logs: [
            {
              id: 'log-1',
              status: 'completed',
              total_rows: 2,
              success_count: 1,
              error_count: 1,
              warning_count: 0,
              created_at: '2026-10-31T10:00:00.000Z',
              importer: { id: 'admin-1', full_name: 'Quản trị viên' },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: 'error-1',
              import_log_id: 'log-1',
              row_number: 3,
              field_name: 'email',
              error_message: 'Email đã được sử dụng',
              severity: 'error',
              created_at: '2026-10-31T10:00:01.000Z',
            },
          ],
        }),
      });

    render(<ImportHistoryPanel />);

    const record = await screen.findByRole('button', { name: /Hoàn tất một phần/i });
    fireEvent.click(record);

    expect(await screen.findByText('Email đã được sử dụng')).toBeInTheDocument();
    await waitFor(() => {
      expect(apiFetch).toHaveBeenLastCalledWith(
        '/api/admin/students/import/errors?import_log_id=log-1'
      );
    });
  });
});
