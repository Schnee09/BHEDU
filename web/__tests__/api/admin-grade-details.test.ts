/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/details/grades/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

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
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
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

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(new Request('http://localhost/api/admin/details/grades/grade-1'), {
      params: Promise.resolve({ id: 'grade-1' }),
    });

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'grades.view');
    expect(query.select).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks grades.view', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(new Request('http://localhost/api/admin/details/grades/grade-1'), {
      params: Promise.resolve({ id: 'grade-1' }),
    });

    expect(response.status).toBe(403);
    expect(query.select).not.toHaveBeenCalled();
  });
});
