/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, GET, POST } from '@/app/api/admin/permissions/roles/[role]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const context = { params: Promise.resolve({ role: '_invalid role' }) };

describe('role permission override code validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'owner-1' },
      role: 'owner',
      user: { id: 'auth-owner-1' },
    } as Awaited<ReturnType<typeof getAuthContext>>);
  });

  it.each([
    ['GET', GET, new NextRequest('http://localhost/api/admin/permissions/roles/bad')],
    [
      'POST',
      POST,
      new NextRequest('http://localhost/api/admin/permissions/roles/bad', {
        method: 'POST',
        body: JSON.stringify({ permission_code: 'students.view' }),
      }),
    ],
    [
      'DELETE',
      DELETE,
      new NextRequest(
        'http://localhost/api/admin/permissions/roles/bad?permission_code=students.view',
        { method: 'DELETE' }
      ),
    ],
  ] as const)('rejects malformed role codes for %s', async (_method, handler, request) => {
    const response = await handler(request, context);

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
