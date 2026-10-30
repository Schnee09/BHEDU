/**
 * @jest-environment node
 */
import { GET } from '@/app/api/students/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));

const findByIdWithEnrollments = jest.fn();

jest.mock('@/lib/repositories/StudentRepository', () => ({
  StudentRepository: jest.fn().mockImplementation(() => ({ findByIdWithEnrollments })),
}));
jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ from: jest.fn() })),
}));

function request() {
  const value: any = new Request('http://localhost/api/students/student-1');
  value.nextUrl = {
    pathname: '/api/students/student-1',
    searchParams: new URLSearchParams(),
  };
  return value;
}

function authenticate(role: string, id = `${role}-1`) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

describe('GET /api/students/[id] authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findByIdWithEnrollments.mockResolvedValue({ id: 'student-1', full_name: 'Nguyễn An' });
  });

  it.each(['teacher', 'tutor', 'parent', 'student'])(
    'rejects %s without access to the requested student',
    async (role) => {
      authenticate(role);
      (canAccessStudent as jest.Mock).mockResolvedValue(false);

      const response = await GET(request(), {
        params: Promise.resolve({ id: 'student-1' }),
      } as any);

      expect(response.status).toBe(403);
      expect(findByIdWithEnrollments).not.toHaveBeenCalled();
    }
  );

  it('allows a tutor assigned to the student class', async () => {
    authenticate('tutor');
    (canAccessStudent as jest.Mock).mockResolvedValue(true);

    const response = await GET(request(), {
      params: Promise.resolve({ id: 'student-1' }),
    } as any);

    expect(response.status).toBe(200);
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'tutor-1', role: 'tutor' },
      'student-1'
    );
    expect(findByIdWithEnrollments).toHaveBeenCalledWith('student-1');
  });

  it.each(['super_admin', 'owner', 'admin', 'staff'])(
    'allows directory role %s without a class lookup',
    async (role) => {
      authenticate(role);

      const response = await GET(request(), {
        params: Promise.resolve({ id: 'student-1' }),
      } as any);

      expect(response.status).toBe(200);
      expect(canAccessStudent).not.toHaveBeenCalled();
      expect(findByIdWithEnrollments).toHaveBeenCalledWith('student-1');
    }
  );
});
