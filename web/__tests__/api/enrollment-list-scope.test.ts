/**
 * @jest-environment node
 */
import { GET } from '@/app/api/enrollments/route';
import { canAccessClass } from '@/lib/auth/classAccess';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';

const findAll = jest.fn();

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));
jest.mock('@/lib/repositories/EnrollmentRepository', () => ({
  EnrollmentRepository: jest.fn().mockImplementation(() => ({ findAll })),
}));

const from = jest.fn();

function request(search = '') {
  const value: any = new Request(`http://localhost/api/enrollments${search}`);
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/enrollments scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getDataClient).mockResolvedValue({ supabase: { from } } as any);
  });

  it('rejects a teacher filtering by an unassigned class', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as any);
    jest.mocked(canAccessClass).mockResolvedValue(false);

    const response = await GET(request('?classId=22222222-2222-4222-8222-222222222222'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(403);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('forces students to list only their own registrations', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: '11111111-1111-4111-8111-111111111111' },
      role: 'student',
    } as any);
    findAll.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 50, totalPages: 0 });

    const response = await GET(request('?studentId=33333333-3333-4333-8333-333333333333'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(
      expect.objectContaining({ student_id: '11111111-1111-4111-8111-111111111111' })
    );
    expect(EnrollmentRepository).toHaveBeenCalled();
  });
});
