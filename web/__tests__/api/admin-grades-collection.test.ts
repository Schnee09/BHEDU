/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/grades/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const query: Record<string, jest.Mock> = {};
for (const method of ['select', 'is', 'order', 'eq', 'in', 'upsert']) {
  query[method] = jest.fn(() => query);
}
query.single = jest.fn();

jest.mock('@/lib/auth/dataClient', () => ({
  getDataClient: jest.fn().mockResolvedValue({
    supabase: { from: jest.fn(() => query) },
    user: { id: 'admin-1' },
  }),
}));

function request(method: 'GET' | 'POST', search = '', body?: unknown) {
  const value: any = new Request(`http://localhost/api/admin/grades${search}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  value.nextUrl = {
    pathname: '/api/admin/grades',
    searchParams: new URLSearchParams(search.replace(/^\?/, '')),
  };
  return value;
}

describe('/api/admin/grades collection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    for (const method of ['select', 'is', 'order', 'eq', 'in', 'upsert']) {
      query[method]!.mockReturnValue(query);
    }
    query.single!.mockResolvedValue({ data: { id: 'grade-1' }, error: null });
  });

  it('hides deleted grades and reads transitional semester codes', async () => {
    const response = await GET(request('GET', '?semester=2026-2027-HK2'));

    expect(response.status).toBe(200);
    expect(query.is).toHaveBeenCalledWith('deleted_at', null);
    expect(query.in).toHaveBeenCalledWith('semester', ['2', '2026-2027-HK2']);
  });

  it('stores the canonical semester and restores a deleted grade on upsert', async () => {
    const response = await POST(
      request('POST', '', {
        student_id: 'student-1',
        class_id: 'class-1',
        subject_id: 'subject-1',
        component_type: 'midterm',
        semester: '2026-2027-HK1',
        score: 8,
      })
    );

    expect(response.status).toBe(200);
    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        semester: '1',
        score: 8,
        deleted_at: null,
        graded_by: 'admin-1',
      }),
      { onConflict: 'student_id,class_id,subject_id,component_type,semester' }
    );
  });

  it('rejects requests without grade management permission before querying data', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('GET'));

    expect(response.status).toBe(403);
    expect(query.select).not.toHaveBeenCalled();
  });
});
