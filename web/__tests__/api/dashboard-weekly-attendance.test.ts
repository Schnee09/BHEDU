/**
 * @jest-environment node
 */
import { GET } from '@/app/api/dashboard/weekly-attendance/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const rpc = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ rpc })),
}));

function request() {
  const value: any = new Request('http://localhost/api/dashboard/weekly-attendance');
  value.nextUrl = {
    pathname: '/api/dashboard/weekly-attendance',
    searchParams: new URLSearchParams(),
  };
  return value;
}

function authenticate(role: string, id = `${role}-1`) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

describe('GET /api/dashboard/weekly-attendance authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rpc.mockResolvedValue({ data: [], error: null });
  });

  it.each(['teacher', 'tutor', 'staff'])(
    'scopes %s attendance to the authenticated profile',
    async (role) => {
      authenticate(role);

      const response = await GET(request(), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(200);
      expect(rpc).toHaveBeenCalledWith('get_weekly_attendance', {
        p_teacher_id: `${role}-1`,
      });
    }
  );

  it.each(['super_admin', 'owner', 'admin'])(
    'allows %s to view center-wide attendance',
    async (role) => {
      authenticate(role);

      const response = await GET(request(), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(200);
      expect(rpc).toHaveBeenCalledWith('get_weekly_attendance', { p_teacher_id: null });
    }
  );

  it('rejects a parent before querying center-wide attendance', async () => {
    authenticate('parent');

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });
});
