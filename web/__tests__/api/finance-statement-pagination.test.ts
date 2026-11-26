/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/finance/statements/transactions/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const query = {
  select: jest.fn(),
  order: jest.fn(),
  range: jest.fn(),
  eq: jest.fn(),
};

function request(search = '') {
  return new NextRequest(`http://localhost/api/admin/finance/statements/transactions${search}`);
}

describe('GET bank statement transactions validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'finance-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.range.mockReturnValue(query);
    query.eq.mockResolvedValue({ data: [], error: null, count: 0 });
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn(() => query),
    } as unknown as ReturnType<typeof createServiceClient>);
  });

  it('uses validated pagination and status filters', async () => {
    const response = await GET(request('?page=2&limit=50&status=confirmed'));

    expect(response.status).toBe(200);
    expect(query.range).toHaveBeenCalledWith(50, 99);
    expect(query.eq).toHaveBeenCalledWith('match_status', 'confirmed');
  });

  it.each(['?page=0', '?page=1.5', '?limit=0', '?limit=101', '?limit=abc', '?status=unknown'])(
    'rejects invalid query parameters: %s',
    async (search) => {
      const response = await GET(request(search));

      expect(response.status).toBe(400);
      expect(createServiceClient).not.toHaveBeenCalled();
    }
  );
});
