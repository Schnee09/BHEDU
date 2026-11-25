/**
 * @jest-environment node
 */
import { GET } from '@/app/api/students/route';
import { getAuthContext } from '@/lib/auth/guard';
import { StudentRepository } from '@/lib/repositories/StudentRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/StudentRepository');

function request() {
  const value: any = new Request('http://localhost/api/students');
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/students scope', () => {
  const findAll = jest.fn();
  const findByTeacher = jest.fn();
  const findById = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    findAll.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 25 });
    findByTeacher.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 25 });
    (StudentRepository as jest.Mock).mockImplementation(() => ({
      findAll,
      findByTeacher,
      findById,
    }));
  });

  it('scopes a custom role with students.view to assigned students', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'coordinator-1' },
      role: 'academic_coordinator',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(findByTeacher).toHaveBeenCalledWith(
      'coordinator-1',
      expect.objectContaining({ pageSize: 25 })
    );
    expect(findAll).not.toHaveBeenCalled();
  });

  it('keeps staff access to the center-wide directory', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalled();
    expect(findByTeacher).not.toHaveBeenCalled();
  });
});
