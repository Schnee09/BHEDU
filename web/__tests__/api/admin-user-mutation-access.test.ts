/**
 * @jest-environment node
 */
import { DELETE, PUT } from '@/app/api/admin/users/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { userService } from '@/lib/services/userService';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/UserRepository');
jest.mock('@/lib/services/userService', () => ({
  userService: { updateUser: jest.fn(), deleteUser: jest.fn() },
}));

const findById = jest.fn();
const update = jest.fn();

function authorize(role = 'admin', id = 'admin-1') {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

function putRequest(body: unknown) {
  const req = new Request('http://localhost/api/admin/users/student-1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

function deleteRequest(id: string, permanent = false) {
  const suffix = permanent ? '?permanent=true' : '';
  const req = new Request(`http://localhost/api/admin/users/${id}${suffix}`, {
    method: 'DELETE',
  }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('admin user mutation access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceClient as jest.Mock).mockReturnValue({});
    authorize();
    findById.mockResolvedValue({ id: 'student-1', role: 'student' });
    update.mockResolvedValue({ id: 'student-1' });
    (UserRepository as jest.Mock).mockImplementation(() => ({ findById, update }));
    (userService.updateUser as jest.Mock).mockResolvedValue({ id: 'student-1', role: 'student' });
  });

  it('validates update payloads before changing a user', async () => {
    const response = await PUT(putRequest({ role: 'Unknown Role' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(400);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('allows assigning an existing custom role within the actor hierarchy', async () => {
    const customRoleQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      maybeSingle: jest.fn(),
    };
    customRoleQuery.select.mockReturnValue(customRoleQuery);
    customRoleQuery.eq.mockReturnValue(customRoleQuery);
    customRoleQuery.maybeSingle.mockResolvedValue({
      data: { code: 'academic_coordinator' },
      error: null,
    });
    (createServiceClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(customRoleQuery),
    });

    const response = await PUT(putRequest({ role: 'academic_coordinator' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(200);
    expect(userService.updateUser).toHaveBeenCalledWith(
      'student-1',
      expect.objectContaining({ role: 'academic_coordinator' })
    );
  });

  it('rejects a well-formed custom role that does not exist', async () => {
    const customRoleQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      maybeSingle: jest.fn(),
    };
    customRoleQuery.select.mockReturnValue(customRoleQuery);
    customRoleQuery.eq.mockReturnValue(customRoleQuery);
    customRoleQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    (createServiceClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue(customRoleQuery),
    });

    const response = await PUT(putRequest({ role: 'missing_custom_role' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(400);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('prevents an admin from granting a protected role', async () => {
    const response = await PUT(putRequest({ role: 'super_admin' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(403);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('prevents an admin from modifying an owner account', async () => {
    findById.mockResolvedValue({ id: 'owner-1', role: 'owner' });

    const response = await PUT(putRequest({ full_name: 'Tên mới' }), {
      params: Promise.resolve({ id: 'owner-1' }),
    });

    expect(response.status).toBe(403);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('prevents an admin from modifying a peer administrator', async () => {
    findById.mockResolvedValue({ id: 'admin-2', role: 'admin' });

    const response = await PUT(putRequest({ full_name: 'Tên mới' }), {
      params: Promise.resolve({ id: 'admin-2' }),
    });

    expect(response.status).toBe(403);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('prevents a custom role from promoting a student', async () => {
    authorize('staff', 'staff-1');

    const response = await PUT(putRequest({ role: 'admin' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(403);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('prevents an administrator from changing their own role', async () => {
    findById.mockResolvedValue({ id: 'admin-1', role: 'admin' });

    const response = await PUT(putRequest({ role: 'teacher' }), {
      params: Promise.resolve({ id: 'admin-1' }),
    });

    expect(response.status).toBe(403);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('honors a custom users.edit grant resolved by the centralized guard', async () => {
    authorize('staff', 'staff-1');

    const response = await PUT(putRequest({ full_name: 'Tên mới' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'users.edit');
    expect(userService.updateUser).toHaveBeenCalledWith(
      'student-1',
      expect.objectContaining({ full_name: 'Tên mới' })
    );
  });

  it('prevents users from deleting their current account', async () => {
    const response = await DELETE(deleteRequest('admin-1'), {
      params: Promise.resolve({ id: 'admin-1' }),
    });

    expect(response.status).toBe(403);
    expect(findById).not.toHaveBeenCalled();
    expect(userService.deleteUser).not.toHaveBeenCalled();
  });

  it('prevents an admin from deactivating a peer administrator', async () => {
    findById.mockResolvedValue({ id: 'admin-2', role: 'admin' });

    const response = await DELETE(deleteRequest('admin-2'), {
      params: Promise.resolve({ id: 'admin-2' }),
    });

    expect(response.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it('requires the hard-delete permission for permanent deletion', async () => {
    (getAuthContext as jest.Mock)
      .mockResolvedValueOnce({
        authorized: true,
        profile: { id: 'admin-1', email: 'admin@example.com' },
        role: 'admin',
      })
      .mockResolvedValueOnce({
        authorized: false,
        profile: { id: 'admin-1', email: 'admin@example.com' },
        role: 'admin',
      });

    const response = await DELETE(deleteRequest('student-1', true), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenLastCalledWith(expect.anything(), 'users.delete.hard');
    expect(userService.deleteUser).not.toHaveBeenCalled();
  });
});
