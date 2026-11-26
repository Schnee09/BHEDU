/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/finance/invoices/route';
import { getAuthContext } from '@/lib/auth/guard';
import { financeService } from '@/lib/services';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services', () => ({
  financeService: { getInvoices: jest.fn() },
}));

function request(search = '') {
  return new NextRequest(`http://localhost/api/admin/finance/invoices${search}`);
}

describe('GET /api/admin/finance/invoices pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'finance-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(financeService.getInvoices).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: 25,
      totalPages: 0,
    } as Awaited<ReturnType<typeof financeService.getInvoices>>);
  });

  it('passes validated pagination to the finance service', async () => {
    const response = await GET(request('?page=2&limit=50'));

    expect(response.status).toBe(200);
    expect(financeService.getInvoices).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 50 })
    );
  });

  it.each(['?page=0', '?page=1.5', '?limit=0', '?limit=101', '?limit=abc'])(
    'rejects invalid pagination: %s',
    async (search) => {
      const response = await GET(request(search));

      expect(response.status).toBe(400);
      expect(financeService.getInvoices).not.toHaveBeenCalled();
    }
  );
});
