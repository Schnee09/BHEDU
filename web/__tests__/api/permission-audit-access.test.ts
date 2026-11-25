/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/permissions/audit/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createClientFromRequest } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClientFromRequest: jest.fn() }));

const query = {
  select: jest.fn(),
  order: jest.fn(),
  eq: jest.fn(),
  range: jest.fn(),
};

function request(search = '') {
  const value: any = new Request(`http://localhost/api/admin/permissions/audit${search}`);
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/admin/permissions/audit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.range.mockResolvedValue({ data: [], count: 0, error: null });
    jest.mocked(createClientFromRequest).mockReturnValue({
      from: jest.fn(() => query),
    } as any);
  });

  it('allows a custom role granted permissions.manage', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'permission-admin-1' },
      role: 'permission_administrator',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request('?page=2&limit=25&scope=user'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'permissions.manage');
    expect(query.eq).toHaveBeenCalledWith('scope', 'user');
    expect(query.range).toHaveBeenCalledWith(25, 49);
  });

  it('rejects access before creating a data client when permission is missing', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(403);
    expect(createClientFromRequest).not.toHaveBeenCalled();
  });

  it.each(['?page=0', '?page=1.5', '?limit=0', '?limit=101', '?limit=abc'])(
    'rejects invalid pagination: %s',
    async (search) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: 'admin-1' },
        role: 'admin',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await GET(request(search), { params: Promise.resolve({}) } as any);

      expect(response.status).toBe(400);
      expect(query.range).not.toHaveBeenCalled();
    }
  );
});
