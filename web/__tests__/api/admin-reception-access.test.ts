/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/reception/students/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

function request() {
  return new NextRequest('http://localhost/api/admin/reception/students?q=an');
}

describe('admin reception student authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 without a profile', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledTimes(1);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'students.view');
  });

  it('rejects a student even when the base role has students.view', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'student-1' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledTimes(1);
  });

  it('requires finance.view after granting staff access to student records', async () => {
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
        reason: 'Missing finance.view',
      } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenNthCalledWith(1, expect.any(NextRequest), 'students.view');
    expect(getAuthContext).toHaveBeenNthCalledWith(2, expect.any(NextRequest), 'finance.view');
  });
});
