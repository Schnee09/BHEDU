/**
 * @jest-environment node
 */
import { POST, GET } from '@/app/api/admin/grading-scales/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const insert = jest.fn();

function request(method: 'GET' | 'POST', body?: unknown) {
  return new Request('http://localhost/api/admin/grading-scales', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('/api/admin/grading-scales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insert.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: { id: 'scale-1' }, error: null }),
      })),
    });
    jest.mocked(getDataClient).mockResolvedValue({
      supabase: {
        from: jest.fn(() => ({ insert })),
      },
    } as unknown as Awaited<ReturnType<typeof getDataClient>>);
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'grades.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks grade access', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'));

    expect(response.status).toBe(403);
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('uses grades.manage and records the authenticated profile on creation', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(
      request('POST', {
        name: 'Thang điểm 10',
        description: 'Thang điểm mặc định',
        scale: [{ min: 0, max: 10 }],
      })
    );

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'grades.manage');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Thang điểm 10',
        created_by: 'admin-1',
      })
    );
  });
});
