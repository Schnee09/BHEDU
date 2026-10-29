/**
 * @jest-environment node
 */
import { GET as getGradeDistribution } from '@/app/api/dashboard/grade-distribution/route';
import { GET as getClassComparison } from '@/app/api/classes/comparison/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const rpc = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ rpc })),
}));

function request(path: string) {
  const value: any = new Request(`http://localhost${path}`);
  value.nextUrl = { pathname: path, searchParams: new URLSearchParams() };
  return value;
}

function authenticate(role: string, id = `${role}-1`) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

describe('dashboard grade analytics authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpc.mockResolvedValue({ data: [], error: null });
  });

  it.each(['teacher', 'tutor', 'staff'])(
    'scopes %s analytics to the authenticated profile',
    async (role) => {
      authenticate(role);

      const distributionResponse = await getGradeDistribution(
        request('/api/dashboard/grade-distribution'),
        { params: Promise.resolve({}) } as any
      );
      const comparisonResponse = await getClassComparison(request('/api/classes/comparison'), {
        params: Promise.resolve({}),
      } as any);

      expect(distributionResponse.status).toBe(200);
      expect(comparisonResponse.status).toBe(200);
      expect(rpc).toHaveBeenNthCalledWith(1, 'get_grade_distribution', {
        p_teacher_id: `${role}-1`,
      });
      expect(rpc).toHaveBeenNthCalledWith(2, 'get_class_averages', {
        p_teacher_id: `${role}-1`,
      });
    }
  );

  it('allows administrators to view center-wide analytics', async () => {
    authenticate('admin');

    await getGradeDistribution(request('/api/dashboard/grade-distribution'), {
      params: Promise.resolve({}),
    } as any);
    await getClassComparison(request('/api/classes/comparison'), {
      params: Promise.resolve({}),
    } as any);

    expect(rpc).toHaveBeenNthCalledWith(1, 'get_grade_distribution', {});
    expect(rpc).toHaveBeenNthCalledWith(2, 'get_class_averages', { p_teacher_id: null });
  });

  it.each(['student', 'parent'])(
    'rejects %s before querying center-wide analytics',
    async (role) => {
      authenticate(role);

      const distributionResponse = await getGradeDistribution(
        request('/api/dashboard/grade-distribution'),
        { params: Promise.resolve({}) } as any
      );
      const comparisonResponse = await getClassComparison(request('/api/classes/comparison'), {
        params: Promise.resolve({}),
      } as any);

      expect(distributionResponse.status).toBe(403);
      expect(comparisonResponse.status).toBe(403);
      expect(rpc).not.toHaveBeenCalled();
    }
  );
});
