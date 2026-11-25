/**
 * @jest-environment node
 */
import { GET } from '@/app/api/owner/dashboard/stats/route';
import { getAuthContext } from '@/lib/auth/guard';
import { DashboardService } from '@/lib/services/DashboardService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services/DashboardService', () => ({
  DashboardService: { getOwnerStats: jest.fn() },
}));

function request() {
  const value: any = new Request('http://localhost/api/owner/dashboard/stats');
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/owner/dashboard/stats permission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows a custom oversight role with reports.center_view', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'auditor-1', email: 'auditor@example.com' },
      role: 'auditor',
    } as any);
    jest.mocked(DashboardService.getOwnerStats).mockResolvedValue({} as any);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'reports.center_view');
    expect(DashboardService.getOwnerStats).toHaveBeenCalled();
  });

  it('rejects access after the center overview permission is revoked', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'owner-1', email: 'owner@example.com' },
      role: 'owner',
    } as any);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(403);
    expect(DashboardService.getOwnerStats).not.toHaveBeenCalled();
  });
});
