/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/audit-logs/route';
import { getAuthContext } from '@/lib/auth/guard';
import { DashboardService } from '@/lib/services/DashboardService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services/DashboardService', () => ({
  DashboardService: { getRecentActivity: jest.fn() },
}));

function request(search = '') {
  const value: any = new Request(`http://localhost/api/admin/audit-logs${search}`);
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/admin/audit-logs scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(DashboardService.getRecentActivity).mockResolvedValue({ items: [], total: 0 });
  });

  it.each([
    ['owner', 'owner-1'],
    ['auditor', 'auditor-1'],
  ])('uses system-wide scope for %s granted system.audit', async (role, id) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id },
      role,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('?limit=25&offset=25&action=update'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(DashboardService.getRecentActivity).toHaveBeenCalledWith(25, 'admin', id, {
      action: 'update',
      entityType: undefined,
      offset: 25,
    });
  });

  it('checks system.audit before loading activity', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'system.audit');
    expect(DashboardService.getRecentActivity).not.toHaveBeenCalled();
  });
});
