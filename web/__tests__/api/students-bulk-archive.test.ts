/**
 * @jest-environment node
 */
import { POST } from '@/app/api/students/bulk-archive/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const profilesQuery = {
  update: jest.fn(),
  in: jest.fn(),
  eq: jest.fn(),
  select: jest.fn(),
};
const enrollmentQuery = {
  select: jest.fn(),
  in: jest.fn(),
  eq: jest.fn(),
};
const from = jest.fn((table: string) =>
  table === 'enrollments' ? enrollmentQuery : profilesQuery
);

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({
    from,
  })),
}));

const STUDENT_1 = '123e4567-e89b-42d3-a456-426614174000';
const STUDENT_2 = '223e4567-e89b-42d3-a456-426614174000';

function request(body: unknown) {
  const value: any = new Request('http://localhost/api/students/bulk-archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  value.nextUrl = {
    pathname: '/api/students/bulk-archive',
    searchParams: new URLSearchParams(),
  };
  return value;
}

function authenticate(role: string) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id: `${role}-1`, email: `${role}@example.com` },
    role,
  });
}

describe('POST /api/students/bulk-archive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profilesQuery.update.mockReturnValue(profilesQuery);
    profilesQuery.in.mockReturnValue(profilesQuery);
    profilesQuery.eq.mockReturnValue(profilesQuery);
    profilesQuery.select.mockResolvedValue({ data: [{ id: STUDENT_1 }], error: null });
    enrollmentQuery.select.mockReturnValue(enrollmentQuery);
    enrollmentQuery.in.mockReturnValue(enrollmentQuery);
    enrollmentQuery.eq.mockReturnValue(enrollmentQuery);
  });

  it.each(['staff', 'teacher', 'tutor', 'student', 'parent'])(
    'rejects %s before updating profiles',
    async (role) => {
      (getAuthContext as jest.Mock).mockResolvedValue({
        authorized: false,
        profile: { id: `${role}-1`, email: `${role}@example.com` },
        role,
      });

      const response = await POST(request({ studentIds: [STUDENT_1] }), {
        params: Promise.resolve({}),
      } as any);

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'students.delete');
      expect(createServiceClient).not.toHaveBeenCalled();
    }
  );

  it('rejects malformed student IDs before updating profiles', async () => {
    authenticate('admin');

    const response = await POST(request({ studentIds: ['not-a-uuid'] }), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it.each(['super_admin', 'owner', 'admin'])(
    'archives valid student IDs for %s and reports unmatched IDs',
    async (role) => {
      authenticate(role);

      const response = await POST(request({ studentIds: [STUDENT_1, STUDENT_2] }), {
        params: Promise.resolve({}),
      } as any);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(profilesQuery.update).toHaveBeenCalledWith({
        status: 'inactive',
        is_active: false,
      });
      expect(profilesQuery.in).toHaveBeenCalledWith('id', [STUDENT_1, STUDENT_2]);
      expect(profilesQuery.eq).toHaveBeenCalledWith('role', 'student');
      expect(body.archivedCount).toBe(1);
      expect(body.failedIds).toEqual([STUDENT_2]);
    }
  );

  it('rejects a custom operator when any student is outside assigned classes', async () => {
    authenticate('records_coordinator');
    enrollmentQuery.eq.mockImplementation((field: string) =>
      field === 'classes.teacher_id'
        ? Promise.resolve({ data: [{ student_id: STUDENT_1 }], error: null })
        : enrollmentQuery
    );

    const response = await POST(request({ studentIds: [STUDENT_1, STUDENT_2] }), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(403);
    expect(enrollmentQuery.eq).toHaveBeenCalledWith('classes.teacher_id', 'records_coordinator-1');
    expect(profilesQuery.update).not.toHaveBeenCalled();
  });
});
