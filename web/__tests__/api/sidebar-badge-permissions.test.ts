/**
 * @jest-environment node
 */
import { GET } from '@/app/api/sidebar/badge-counts/route';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({
  createClientFromRequest: jest.fn(),
  createServiceClient: jest.fn(),
}));

function request() {
  return new Request('http://localhost/api/sidebar/badge-counts') as any;
}

function setupServiceClient() {
  const profileQuery: any = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  };
  profileQuery.select.mockReturnValue(profileQuery);
  profileQuery.eq.mockReturnValue(profileQuery);
  profileQuery.maybeSingle.mockResolvedValue({
    data: { id: 'staff-1', role: 'staff' },
    error: null,
  });

  const notificationQuery: any = {
    select: jest.fn(),
    or: jest.fn(),
    eq: jest.fn(),
  };
  notificationQuery.select.mockReturnValue(notificationQuery);
  notificationQuery.or.mockReturnValue(notificationQuery);
  notificationQuery.eq.mockResolvedValue({ count: 2, error: null });

  const parentLinkQuery: any = {
    select: jest.fn(),
    eq: jest.fn(),
  };
  parentLinkQuery.select.mockReturnValue(parentLinkQuery);
  parentLinkQuery.eq.mockResolvedValue({ count: 3, error: null });

  const from = jest.fn((table: string) => {
    if (table === 'profiles') return profileQuery;
    if (table === 'notifications') return notificationQuery;
    if (table === 'parent_student_links') return parentLinkQuery;
    throw new Error(`Unexpected table: ${table}`);
  });
  jest.mocked(createServiceClient).mockReturnValue({ from } as any);
  return { from };
}

describe('GET /api/sidebar/badge-counts permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createClientFromRequest).mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'auth-1', email: 'staff@example.com' } },
          error: null,
        }),
      },
    } as any);
  });

  it('shows pending parent links to a custom role with the effective permission', async () => {
    const { from } = setupServiceClient();
    jest.mocked(resolveServerPermission).mockResolvedValue(true);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(resolveServerPermission).toHaveBeenCalledWith(
      'staff-1',
      'staff',
      'parent_links.approve'
    );
    expect(from).toHaveBeenCalledWith('parent_student_links');
    expect(body.counts.pendingParentLinks).toBe(3);
  });

  it('does not query pending links after the permission is revoked', async () => {
    const { from } = setupServiceClient();
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(from).not.toHaveBeenCalledWith('parent_student_links');
  });
});
