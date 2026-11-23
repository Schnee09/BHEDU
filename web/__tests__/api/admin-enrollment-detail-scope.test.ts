/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/enrollments/[id]/route';
import { canAccessClass, canAccessStudent } from '@/lib/auth/classAccess';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';

const findById = jest.fn();

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'student-1', email: 'student@example.com' },
    role: 'student',
  }),
}));
jest.mock('@/lib/auth/classAccess', () => ({
  canAccessClass: jest.fn(),
  canAccessStudent: jest.fn(),
}));
jest.mock('@/lib/auth/dataClient', () => ({
  getDataClient: jest.fn().mockResolvedValue({ supabase: {} }),
}));
jest.mock('@/lib/repositories/EnrollmentRepository', () => ({
  EnrollmentRepository: jest.fn().mockImplementation(() => ({ findById })),
}));

const context = { params: Promise.resolve({ id: 'enrollment-1' }) } as any;

function request() {
  const value: any = new Request('http://localhost/api/admin/enrollments/enrollment-1');
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/admin/enrollments/[id] scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findById.mockResolvedValue({
      id: 'enrollment-1',
      class_id: 'class-1',
      student_id: 'student-2',
    });
    jest.mocked(canAccessClass).mockResolvedValue(false);
    jest.mocked(canAccessStudent).mockResolvedValue(false);
  });

  it('blocks a registration outside the permitted class and student scope', async () => {
    const response = await GET(request(), context);

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'student-1', role: 'student' }),
      'class-1'
    );
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'student-1', role: 'student' }),
      'student-2'
    );
  });

  it('allows the student to view their own registration', async () => {
    jest.mocked(canAccessStudent).mockResolvedValue(true);

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(EnrollmentRepository).toHaveBeenCalled();
  });
});
