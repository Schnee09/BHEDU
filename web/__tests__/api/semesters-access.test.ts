/**
 * @jest-environment node
 */
import { GET } from '@/app/api/semesters/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const order = jest.fn();
const query = { select: jest.fn(), order };
jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ from: jest.fn(() => query) })),
}));

function request() {
  const req = new Request('http://localhost/api/semesters') as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('GET /api/semesters access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    order.mockResolvedValue({ data: [], error: null });
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    });
  });

  it('requires authentication before using the service client', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false, reason: 'Unauthorized' });

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('returns semesters to an authenticated dashboard user', async () => {
    order.mockResolvedValue({
      data: [{ id: 'semester-1', name: 'Học kỳ 1' }],
      error: null,
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.semesters).toEqual([{ id: 'semester-1', name: 'Học kỳ 1' }]);
  });

  it('does not expose database errors as successful responses', async () => {
    order.mockResolvedValue({
      data: null,
      error: new Error('secret semesters table detail'),
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('secret semesters table detail');
  });
});
