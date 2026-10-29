/**
 * @jest-environment node
 */
import { GET } from '@/app/api/dashboard/stats/route';
import { getAuthContext } from '@/lib/auth/guard';
import { DashboardService } from '@/lib/services/DashboardService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services/DashboardService', () => ({
  DashboardService: {
    getStats: jest.fn(),
    getRecentActivity: jest.fn(),
  },
}));

function request() {
  const value: any = new Request('http://localhost/api/dashboard/stats');
  value.nextUrl = {
    pathname: '/api/dashboard/stats',
    searchParams: new URLSearchParams(),
  };
  return value;
}

function authenticate(role: string, id = `${role}-1`) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

describe('GET /api/dashboard/stats authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['teacher', 'tutor', 'staff', 'student', 'parent'])(
    'rejects %s before loading center-wide statistics',
    async (role) => {
      authenticate(role);

      const response = await GET(request(), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(403);
      expect(DashboardService.getStats).not.toHaveBeenCalled();
      expect(DashboardService.getRecentActivity).not.toHaveBeenCalled();
    }
  );

  it.each(['super_admin', 'owner', 'admin'])(
    'loads center-wide statistics for %s',
    async (role) => {
      authenticate(role);
      (DashboardService.getStats as jest.Mock).mockResolvedValue({ totalStudents: 12 });
      (DashboardService.getRecentActivity as jest.Mock).mockResolvedValue({ items: [], total: 0 });

      const response = await GET(request(), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(200);
      expect(DashboardService.getStats).toHaveBeenCalledWith(role, `${role}-1`);
      expect(DashboardService.getRecentActivity).toHaveBeenCalledWith(10, role, `${role}-1`);
    }
  );
});
