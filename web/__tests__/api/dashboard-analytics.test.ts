/**
 * @jest-environment node
 */
import { applyGradeScope, GET } from '@/app/api/dashboard/analytics/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

function request() {
  const value: any = new Request('http://localhost/api/dashboard/analytics');
  value.nextUrl = {
    pathname: '/api/dashboard/analytics',
    searchParams: new URLSearchParams(),
  };
  return value;
}

describe('GET /api/dashboard/analytics authorization', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['teacher', 'tutor', 'staff', 'student', 'parent'])(
    'rejects %s before loading center-wide analytics',
    async (role) => {
      (getAuthContext as jest.Mock).mockResolvedValue({
        authorized: true,
        profile: { id: `${role}-1`, email: `${role}@example.com` },
        role,
      });

      const response = await GET(request(), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(403);
      expect(createClient).not.toHaveBeenCalled();
    }
  );
});

describe('dashboard grade scope', () => {
  it('filters by academic year and transitional semester aliases', () => {
    const query = {
      eq: jest.fn(),
      in: jest.fn(),
    } as any;
    query.eq.mockReturnValue(query);
    query.in.mockReturnValue(query);

    applyGradeScope(query, 'year-1', '2026-2027-HK1');

    expect(query.eq).toHaveBeenCalledWith('academic_year_id', 'year-1');
    expect(query.in).toHaveBeenCalledWith('semester', ['1', '2026-2027-HK1']);
  });
});
