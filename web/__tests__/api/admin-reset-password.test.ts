/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/users/[id]/reset-password/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));
jest.mock('@/lib/email/emailService', () => ({
  generatePasswordResetEmail: jest.fn(),
  sendEmail: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const profileQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
};
const updateUserById = jest.fn();
const activityInsert = jest.fn().mockResolvedValue({ error: null });
const context = { params: Promise.resolve({ id: 'profile-1' }) };

function request(body: unknown = { new_password: 'SecurePass123!', send_email: false }) {
  return new Request('http://localhost/api/admin/users/profile-1/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/users/[id]/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profileQuery.select.mockReturnValue(profileQuery);
    profileQuery.eq.mockReturnValue(profileQuery);
    updateUserById.mockResolvedValue({ error: null });
    jest.mocked(getDataClient).mockResolvedValue({
      supabase: {
        auth: { admin: { updateUserById } },
        from: jest.fn((table: string) =>
          table === 'profiles' ? profileQuery : { insert: activityInsert }
        ),
      },
    } as unknown as Awaited<ReturnType<typeof getDataClient>>);
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(request(), context);

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'users.edit');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks users.edit', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(request(), context);

    expect(response.status).toBe(403);
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('uses the linked Auth user ID instead of the profile ID', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'profile-1',
        user_id: 'auth-user-1',
        role: 'teacher',
        full_name: 'Giáo viên A',
        email: 'teacher@bhedu.vn',
        is_managed: true,
      },
      error: null,
    });

    const response = await POST(request(), context);

    expect(response.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith('auth-user-1', {
      password: 'SecurePass123!',
    });
    expect(activityInsert).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { reset_by: 'admin-1' } })
    );
  });

  it('prevents non-super-admins from resetting protected accounts', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'profile-1',
        user_id: 'auth-owner-1',
        role: 'owner',
        full_name: 'Chủ trung tâm',
        email: 'owner@bhedu.vn',
        is_managed: true,
      },
      error: null,
    });

    const response = await POST(request(), context);

    expect(response.status).toBe(403);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('prevents an admin from resetting a peer administrator password', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'admin-2',
        user_id: 'auth-admin-2',
        role: 'admin',
        full_name: 'Quản trị viên khác',
        email: 'admin2@bhedu.vn',
        is_managed: true,
      },
      error: null,
    });

    const response = await POST(request(), context);

    expect(response.status).toBe(403);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('prevents a custom role from resetting another account password', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@bhedu.vn' },
      role: 'password_manager',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    profileQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'profile-1',
        user_id: 'auth-user-1',
        role: 'teacher',
        full_name: 'Giáo viên A',
        email: 'teacher@bhedu.vn',
        is_managed: true,
      },
      error: null,
    });

    const response = await POST(request(), context);

    expect(response.status).toBe(403);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it.each([
    null,
    [],
    { new_password: 'short', send_email: false },
    { new_password: 'SecurePass123!', send_email: 'false' },
  ])('rejects invalid password reset payload %p before loading the account', async (body) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(request(body), context);

    expect(response.status).toBe(400);
    expect(getDataClient).not.toHaveBeenCalled();
  });
});
