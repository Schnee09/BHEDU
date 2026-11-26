/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/finance/payments/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const query = {
  select: jest.fn(),
  order: jest.fn(),
  range: jest.fn(),
  in: jest.fn(),
};

function request(search = '') {
  return new NextRequest(`http://localhost/api/admin/finance/payments${search}`);
}

describe('GET /api/admin/finance/payments pagination', () => {
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
    query.in.mockReturnValue(query);
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn(() => query),
    } as unknown as ReturnType<typeof createServiceClient>);
  });

  it('uses validated pagination for the payment query', async () => {
    const response = await GET(request('?page=2&limit=50'));

    expect(response.status).toBe(200);
    expect(query.range).toHaveBeenCalledWith(50, 99);
  });

  it.each(['?page=0', '?page=1.5', '?limit=0', '?limit=101', '?limit=abc'])(
    'rejects invalid pagination: %s',
    async (search) => {
      const response = await GET(request(search));

      expect(response.status).toBe(400);
      expect(createServiceClient).not.toHaveBeenCalled();
    }
  );
});
