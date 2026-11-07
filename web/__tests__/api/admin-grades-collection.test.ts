/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/grades/route';

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
      expect.objectContaining({ semester: '1', score: 8, deleted_at: null }),
      { onConflict: 'student_id,class_id,subject_id,component_type,semester' }
    );
  });
});
