/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/reception/students/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

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

  it('rejects a student who has students.view but lacks finance.view', async () => {
    jest
      .mocked(getAuthContext)
      .mockResolvedValueOnce({
        authorized: true,
        profile: { id: 'student-1' },
        role: 'student',
      } as Awaited<ReturnType<typeof getAuthContext>>)
      .mockResolvedValueOnce({
        authorized: false,
        profile: { id: 'student-1' },
        role: 'student',
        reason: 'Missing finance.view',
      } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenNthCalledWith(2, expect.any(NextRequest), 'finance.view');
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

  it('allows a custom role when both reception permissions are granted', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'reception-1' },
      role: 'reception',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const profilesQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      is: jest.fn(),
      or: jest.fn(),
      order: jest.fn(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    profilesQuery.select.mockReturnValue(profilesQuery);
    profilesQuery.eq.mockReturnValue(profilesQuery);
    profilesQuery.is.mockReturnValue(profilesQuery);
    profilesQuery.or.mockReturnValue(profilesQuery);
    profilesQuery.order.mockReturnValue(profilesQuery);
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn(() => profilesQuery),
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await GET(request());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenNthCalledWith(1, expect.any(NextRequest), 'students.view');
    expect(getAuthContext).toHaveBeenNthCalledWith(2, expect.any(NextRequest), 'finance.view');
    expect(json.students).toEqual([]);
  });
});
