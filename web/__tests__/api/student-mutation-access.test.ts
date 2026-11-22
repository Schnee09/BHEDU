/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST as CREATE_STUDENT } from '@/app/api/students/route';
import { DELETE, GET, PATCH } from '@/app/api/students/[id]/route';
import { POST as BULK_ARCHIVE } from '@/app/api/students/bulk-archive/route';
import { getAuthContext } from '@/lib/auth/guard';
import { StudentRepository } from '@/lib/repositories/StudentRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/repositories/StudentRepository');
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));

const detailContext = { params: Promise.resolve({ id: 'student-1' }) };

function request(path: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('student mutation authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      'student list detail',
      (req: NextRequest) => GET(req, detailContext),
      request('/api/students/student-1', 'GET'),
      'students.view',
    ],
    [
      'student creation',
      (req: NextRequest) => CREATE_STUDENT(req),
      request('/api/students', 'POST', {}),
      'students.create',
    ],
    [
      'student update',
      (req: NextRequest) => PATCH(req, detailContext),
      request('/api/students/student-1', 'PATCH', {}),
      'students.edit',
    ],
    [
      'student deletion',
      (req: NextRequest) => DELETE(req, detailContext),
      request('/api/students/student-1', 'DELETE'),
      'students.delete',
    ],
    [
      'bulk student archive',
      (req: NextRequest) => BULK_ARCHIVE(req),
      request('/api/students/bulk-archive', 'POST', {}),
      'students.delete',
    ],
  ] as const)(
    'requires the explicit permission for %s',
    async (_name, handler, req, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'staff-1' },
        role: 'staff',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(req);

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );

  it('allows staff granted students.edit dynamically to update a student', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const update = jest.fn().mockResolvedValue({ id: 'student-1', full_name: 'Nguyễn An' });
    jest.mocked(StudentRepository).mockImplementation(
      () =>
        ({
          update,
        }) as unknown as StudentRepository
    );

    const response = await PATCH(
      request('/api/students/student-1', 'PATCH', { full_name: 'Nguyễn An' }),
      detailContext
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      'student-1',
      expect.objectContaining({ full_name: 'Nguyễn An' })
    );
  });
});
