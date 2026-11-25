/**
 * @jest-environment node
 */
import { DELETE, GET, PUT } from '@/app/api/admin/students/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessStudent } from '@/lib/auth/classAccess';
import { studentService } from '@/lib/services/studentService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/services/studentService', () => ({
  studentService: { getStudentById: jest.fn() },
}));

const context = { params: Promise.resolve({ id: 'student-1' }) };
const request = new NextRequest('http://localhost/api/admin/students/student-1');

function authenticate(role: string, id = `${role}-1`) {
  jest.mocked(getAuthContext).mockResolvedValue({
    authorized: true,
    profile: { id },
    role,
  } as Awaited<ReturnType<typeof getAuthContext>>);
}

describe('GET /api/admin/students/[id] scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(studentService.getStudentById).mockResolvedValue({ id: 'student-1' } as any);
  });

  it('rejects a custom role outside the student scope', async () => {
    authenticate('academic_coordinator', 'coordinator-1');
    jest.mocked(canAccessStudent).mockResolvedValue(false);

    const response = await GET(request, context);

    expect(response.status).toBe(403);
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'coordinator-1', role: 'academic_coordinator' },
      'student-1'
    );
    expect(studentService.getStudentById).not.toHaveBeenCalled();
  });

  it('allows a custom role to view an assigned student', async () => {
    authenticate('academic_coordinator', 'coordinator-1');
    jest.mocked(canAccessStudent).mockResolvedValue(true);

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(studentService.getStudentById).toHaveBeenCalledWith('student-1');
  });

  it('keeps staff access to the center-wide directory', async () => {
    authenticate('staff', 'staff-1');

    const response = await GET(request, context);

    expect(response.status).toBe(200);
    expect(canAccessStudent).not.toHaveBeenCalled();
  });

  it.each([
    ['PUT', PUT],
    ['DELETE', DELETE],
  ] as const)('rejects %s outside the student scope', async (method, handler) => {
    authenticate('academic_coordinator', 'operator-1');
    jest.mocked(canAccessStudent).mockResolvedValue(false);
    const mutationRequest = new NextRequest('http://localhost/api/admin/students/student-1', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'PUT' ? JSON.stringify({ full_name: 'Học sinh A' }) : undefined,
    });

    const response = await handler(mutationRequest, context);

    expect(response.status).toBe(403);
  });
});
