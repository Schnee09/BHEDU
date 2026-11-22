/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/users/stats/route';
import { getAuthContext } from '@/lib/auth/guard';
import { UserRepository } from '@/lib/repositories/UserRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/repositories/UserRepository');
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));

function request() {
  return new NextRequest('http://localhost/api/admin/users/stats');
}

describe('GET /api/admin/users/stats authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires users.view before loading center-wide account statistics', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'users.view');
    expect(UserRepository).not.toHaveBeenCalled();
  });

  it('allows a custom role granted users.view dynamically', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'auditor-1', email: 'auditor@example.com' },
      role: 'auditor',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const getStatistics = jest.fn().mockResolvedValue({ total: 12, active: 10 });
    jest.mocked(UserRepository).mockImplementation(
      () =>
        ({
          getStatistics,
        }) as unknown as UserRepository
    );

    const response = await GET(request());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(getStatistics).toHaveBeenCalled();
    expect(json.total).toBe(12);
  });
});
