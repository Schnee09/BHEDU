/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, PUT } from '@/app/api/admin/roles/[code]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { resolveServerPermission } from '@/lib/auth/permissionResolver';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/permissionResolver', () => ({ resolveServerPermission: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const context = { params: Promise.resolve({ code: 'office_staff' }) };

function request(method: 'PUT' | 'DELETE', body?: object) {
  return new NextRequest('http://localhost/api/admin/roles/office_staff', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('admin role detail authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['role update', (req: NextRequest) => PUT(req, context), 'PUT' as const],
    ['role deletion', (req: NextRequest) => DELETE(req, context), 'DELETE' as const],
  ])('returns 401 for %s without a profile', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'permissions.manage');
  });

  it.each([
    ['role update', (req: NextRequest) => PUT(req, context), 'PUT' as const],
    ['role deletion', (req: NextRequest) => DELETE(req, context), 'DELETE' as const],
  ])('returns 403 for %s without permissions.manage', async (_name, handler, method) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(request(method));

    expect(response.status).toBe(403);
  });

  it('prevents a non-super-admin from delegating a permission they do not have', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'owner-1' },
      role: 'owner',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(resolveServerPermission).mockResolvedValue(false);

    const response = await PUT(
      request('PUT', { name: 'Nhân viên', permissions: ['system.settings'] }),
      context
    );

    expect(response.status).toBe(403);
    expect(resolveServerPermission).toHaveBeenCalledWith('owner-1', 'owner', 'system.settings');
  });
});
