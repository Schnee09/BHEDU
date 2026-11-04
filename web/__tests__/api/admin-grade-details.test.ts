/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/details/grades/[id]/route';
import { adminAuth } from '@/lib/auth/adminAuth';

jest.mock('@/lib/auth/adminAuth', () => ({ adminAuth: jest.fn() }));

const query = {
  select: jest.fn(),
  eq: jest.fn(),
  is: jest.fn(),
  maybeSingle: jest.fn(),
};

jest.mock('@/lib/auth/dataClient', () => ({
  getDataClient: jest.fn().mockResolvedValue({
    supabase: { from: jest.fn(() => query) },
  }),
}));

describe('GET /api/admin/details/grades/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminAuth as jest.Mock).mockResolvedValue({ authorized: true });
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({
      data: { id: 'grade-1', points_earned: 8, assignment: { total_points: 10 } },
      error: null,
    });
  });

  it('only returns an active grade', async () => {
    const response = await GET(new Request('http://localhost/api/admin/details/grades/grade-1'), {
      params: Promise.resolve({ id: 'grade-1' }),
    });

    expect(response.status).toBe(200);
    expect(query.is).toHaveBeenCalledWith('deleted_at', null);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { id: 'grade-1', percentage: 80 },
    });
  });
});
