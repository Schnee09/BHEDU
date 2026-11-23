/**
 * @jest-environment node
 */
import { GET } from '@/app/api/classes/my-classes/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

function request() {
  return new Request('http://localhost/api/classes/my-classes');
}

describe('GET /api/classes/my-classes scope', () => {
  it.each(['teacher', 'tutor', 'staff'])('limits %s to assigned classes', async (role) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: `${role}-1` },
      role,
    } as any);
    const query: any = {
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.order.mockResolvedValue({ data: [], error: null });
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn(() => query),
    } as any);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith('teacher_id', `${role}-1`);
  });
});
