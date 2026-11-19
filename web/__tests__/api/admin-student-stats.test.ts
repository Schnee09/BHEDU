/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/students/stats/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

describe('GET /api/admin/students/stats authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(new Request('http://localhost/api/admin/students/stats'));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'students.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks students.view', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(new Request('http://localhost/api/admin/students/stats'));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'students.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });
});
