/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/students/stats/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));

describe('GET /api/admin/students/stats authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(resolveServerPermission).mockResolvedValue(false);
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(new Request('http://localhost/api/admin/students/stats'));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'students.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks students.view', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(new Request('http://localhost/api/admin/students/stats'));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'students.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('rejects a scoped teacher from center-wide student statistics', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(new Request('http://localhost/api/admin/students/stats'));

    expect(response.status).toBe(403);
    expect(resolveServerPermission).toHaveBeenCalledWith(
      'teacher-1',
      'teacher',
      'reports.center_view'
    );
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('allows a custom role with center report access', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'coordinator-1' },
      role: 'center_coordinator',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(resolveServerPermission).mockResolvedValue(true);
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      not: jest.fn(),
      gte: jest.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.not.mockReturnValue(query);
    query.gte.mockReturnValue(query);
    jest.mocked(getDataClient).mockResolvedValue({
      supabase: { from: jest.fn(() => query) },
    } as any);

    const response = await GET(new Request('http://localhost/api/admin/students/stats'));

    expect(response.status).toBe(200);
    expect(getDataClient).toHaveBeenCalled();
  });
});
