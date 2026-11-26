/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/details/students/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { canAccessStudent } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));

const context = { params: Promise.resolve({ id: 'student-1' }) };
const request = new Request('http://localhost/api/admin/details/students/student-1');

describe('GET /api/admin/details/students/[id] authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request, context);

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(request, 'students.view');
    expect(getAuthContext).toHaveBeenCalledTimes(1);
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks students.view', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-2' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request, context);

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledTimes(1);
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('also requires finance.view before exposing invoices and payments', async () => {
    jest
      .mocked(getAuthContext)
      .mockResolvedValueOnce({
        authorized: true,
        profile: { id: 'staff-1' },
        role: 'staff',
      } as Awaited<ReturnType<typeof getAuthContext>>)
      .mockResolvedValueOnce({
        authorized: false,
        profile: { id: 'staff-1' },
        role: 'staff',
      } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request, context);

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenNthCalledWith(1, request, 'students.view');
    expect(getAuthContext).toHaveBeenNthCalledWith(2, request, 'finance.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('rejects combined student and finance access outside the student scope', async () => {
    jest
      .mocked(getAuthContext)
      .mockResolvedValueOnce({
        authorized: true,
        profile: { id: 'teacher-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>)
      .mockResolvedValueOnce({
        authorized: true,
        profile: { id: 'teacher-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(getDataClient).mockResolvedValue({ supabase: {} } as any);
    jest.mocked(canAccessStudent).mockResolvedValue(false);

    const response = await GET(request, context);

    expect(response.status).toBe(403);
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'teacher-1', role: 'teacher' },
      'student-1'
    );
  });
});
