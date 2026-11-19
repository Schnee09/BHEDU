/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/academic-years/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const insert = jest.fn();

function request(method: 'GET' | 'POST', body?: unknown) {
  return new Request('http://localhost/api/admin/academic-years', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('/api/admin/academic-years authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    insert.mockReturnValue({
      select: jest.fn(() => ({
        single: jest.fn().mockResolvedValue({ data: { id: 'year-1' }, error: null }),
      })),
    });
    jest.mocked(getDataClient).mockResolvedValue({
      supabase: { from: jest.fn(() => ({ insert })) },
    } as unknown as Awaited<ReturnType<typeof getDataClient>>);
  });

  it('requires an authenticated profile for reads', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'classes.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile cannot manage academic years', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(
      request('POST', {
        name: '2026-2027',
        start_date: '2026-08-01',
        end_date: '2027-05-31',
      })
    );

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'classes.manage');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('records the authenticated profile when creating an academic year', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(
      request('POST', {
        name: '2026-2027',
        start_date: '2026-08-01',
        end_date: '2027-05-31',
      })
    );

    expect(response.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '2026-2027',
        created_by: 'admin-1',
      })
    );
  });
});
