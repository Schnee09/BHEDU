/**
 * @jest-environment node
 */
import { POST as createTeachingUser } from '@/app/api/admin/teachers/route';
import { GET as getTeachers } from '@/app/api/teachers/route';
import { GET as getTutors } from '@/app/api/tutors/route';
import { getAuthContext } from '@/lib/auth/guard';
import { teacherService } from '@/lib/services/teacherService';
import { userService } from '@/lib/services/userService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services/teacherService', () => ({
  teacherService: {
    getTeachers: jest.fn(),
    getTutors: jest.fn(),
    getTeachersWithStats: jest.fn(),
  },
}));
jest.mock('@/lib/services/userService', () => ({
  userService: { createUser: jest.fn() },
}));

function request(path: string, body?: unknown) {
  const req = new Request(`http://localhost${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

function authorize(role = 'admin') {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id: 'admin-1', email: 'admin@example.com' },
    role,
  });
}

describe('teacher and tutor collection access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorize();
    (teacherService.getTeachers as jest.Mock).mockResolvedValue([]);
    (teacherService.getTutors as jest.Mock).mockResolvedValue([]);
    (userService.createUser as jest.Mock).mockResolvedValue({ id: 'teacher-1' });
  });

  it.each([
    ['/api/teachers', getTeachers, 'getTeachers'],
    ['/api/tutors', getTutors, 'getTutors'],
  ] as const)('requires users.view for %s', async (path, handler, serviceMethod) => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1', email: 'student@example.com' },
      role: 'student',
      reason: 'Forbidden',
    });

    const response = await handler(request(path));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'users.view');
    expect(teacherService[serviceMethod] as jest.Mock).not.toHaveBeenCalled();
  });

  it('rejects privileged roles on the teaching-user creation endpoint', async () => {
    const response = await createTeachingUser(
      request('/api/admin/teachers', { full_name: 'Chủ trung tâm', role: 'owner' })
    );

    expect(response.status).toBe(400);
    expect(userService.createUser).not.toHaveBeenCalled();
  });

  it('defaults a validated teaching account to the teacher role', async () => {
    const response = await createTeachingUser(
      request('/api/admin/teachers', { full_name: 'Nguyễn Văn A' })
    );

    expect(response.status).toBe(200);
    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Nguyễn Văn A',
        role: 'teacher',
        status: 'active',
        is_managed: true,
      }),
      'admin',
      'admin-1'
    );
  });
});
