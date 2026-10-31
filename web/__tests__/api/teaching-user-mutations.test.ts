/**
 * @jest-environment node
 */
import { DELETE as deleteTeacher, PUT as updateTeacher } from '@/app/api/teachers/[id]/route';
import { DELETE as deleteTutor, PUT as updateTutor } from '@/app/api/tutors/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { userService } from '@/lib/services/userService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/UserRepository');
jest.mock('@/lib/services/userService', () => ({
  userService: { updateUser: jest.fn(), deleteUser: jest.fn() },
}));

const findById = jest.fn();
const update = jest.fn();

function request(resource: 'teachers' | 'tutors', method: 'PUT' | 'DELETE', body?: unknown) {
  const req = new Request(`http://localhost/api/${resource}/target-1`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('teacher and tutor mutation boundaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });
    update.mockResolvedValue({ id: 'target-1' });
    (UserRepository as jest.Mock).mockImplementation(() => ({ findById, update }));
    (userService.updateUser as jest.Mock).mockResolvedValue({ id: 'target-1' });
  });

  it('strips role changes from the teacher update payload', async () => {
    findById.mockResolvedValue({ id: 'target-1', role: 'teacher' });

    const response = await updateTeacher(
      request('teachers', 'PUT', { full_name: 'Tên mới', role: 'owner' }),
      { params: Promise.resolve({ id: 'target-1' }) }
    );

    expect(response.status).toBe(200);
    expect(userService.updateUser).toHaveBeenCalledWith('target-1', { full_name: 'Tên mới' });
  });

  it('does not allow the teacher endpoint to mutate another account type', async () => {
    findById.mockResolvedValue({ id: 'target-1', role: 'owner' });

    const response = await updateTeacher(request('teachers', 'PUT', { full_name: 'Tên mới' }), {
      params: Promise.resolve({ id: 'target-1' }),
    });

    expect(response.status).toBe(404);
    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('soft-deactivates a teacher instead of permanently deleting Auth data', async () => {
    findById.mockResolvedValue({ id: 'target-1', role: 'teacher' });

    const response = await deleteTeacher(request('teachers', 'DELETE'), {
      params: Promise.resolve({ id: 'target-1' }),
    });

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith('target-1', { is_active: false });
    expect(userService.deleteUser).not.toHaveBeenCalled();
  });

  it('applies the same role boundary and soft deletion to tutors', async () => {
    findById.mockResolvedValue({ id: 'target-1', role: 'tutor' });

    const updateResponse = await updateTutor(
      request('tutors', 'PUT', { full_name: 'Tên mới', role: 'super_admin' }),
      { params: Promise.resolve({ id: 'target-1' }) }
    );
    const deleteResponse = await deleteTutor(request('tutors', 'DELETE'), {
      params: Promise.resolve({ id: 'target-1' }),
    });

    expect(updateResponse.status).toBe(200);
    expect(deleteResponse.status).toBe(200);
    expect(userService.updateUser).toHaveBeenCalledWith('target-1', { full_name: 'Tên mới' });
    expect(update).toHaveBeenCalledWith('target-1', { is_active: false });
    expect(userService.deleteUser).not.toHaveBeenCalled();
  });
});
