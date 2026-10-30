/**
 * @jest-environment node
 */
import { GET } from '@/app/api/reports/export/status/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/api/rateLimit', () => ({ enforceRateLimit: jest.fn(() => null) }));

const exportQuery = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() };
const createSignedUrl = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => exportQuery),
    storage: { from: jest.fn(() => ({ createSignedUrl })) },
  })),
}));

function request() {
  const value: any = new Request('http://localhost/api/reports/export/status/job-1');
  value.nextUrl = {
    pathname: '/api/reports/export/status/job-1',
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

describe('GET /api/reports/export/status/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    exportQuery.select.mockReturnValue(exportQuery);
    exportQuery.eq.mockReturnValue(exportQuery);
    exportQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'job-1',
        status: 'pending',
        created_at: '2026-10-30T00:00:00Z',
        started_at: null,
        finished_at: null,
        result_path: null,
        error_message: null,
        requested_by: 'teacher-1',
      },
      error: null,
    });
    createSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example/report' },
      error: null,
    });
  });

  it('allows the requester to inspect their own export', async () => {
    authenticate('teacher');

    const response = await GET(request(), {
      params: Promise.resolve({ id: 'job-1' }),
    } as any);

    expect(response.status).toBe(200);
  });

  it('rejects a different non-management user', async () => {
    authenticate('teacher', 'teacher-2');

    const response = await GET(request(), {
      params: Promise.resolve({ id: 'job-1' }),
    } as any);

    expect(response.status).toBe(403);
  });

  it.each(['super_admin', 'owner', 'admin'])(
    'allows %s to monitor exports across the center',
    async (role) => {
      authenticate(role);

      const response = await GET(request(), {
        params: Promise.resolve({ id: 'job-1' }),
      } as any);

      expect(response.status).toBe(200);
    }
  );

  it('creates a fresh short-lived URL for a completed owned export', async () => {
    authenticate('teacher');
    exportQuery.maybeSingle.mockResolvedValue({
      data: {
        id: 'job-1',
        status: 'succeeded',
        created_at: '2026-10-30T00:00:00Z',
        started_at: '2026-10-30T00:01:00Z',
        finished_at: '2026-10-30T00:02:00Z',
        result_path: 'reports/attendance.csv',
        error_message: null,
        requested_by: 'teacher-1',
      },
      error: null,
    });

    const response = await GET(request(), {
      params: Promise.resolve({ id: 'job-1' }),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createSignedUrl).toHaveBeenCalledWith('reports/attendance.csv', 900);
    expect(body.job.downloadUrl).toBe('https://signed.example/report');
  });
});
