/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/settings/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

describe('settings authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('limits unauthenticated reads to public settings and hides slot counts', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const eq = jest.fn().mockResolvedValue({ data: [], error: null });
    const select = jest.fn(() => ({ eq }));
    jest.mocked(createServiceClient).mockReturnValue({
      from: jest.fn(() => ({ select })),
    } as unknown as ReturnType<typeof createServiceClient>);

    const response = await GET(
      new NextRequest('http://localhost/api/settings?include_counts=true')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith('is_public', true);
    expect(body.slotCounts).toBeUndefined();
  });

  it('returns 401 when an unauthenticated user updates settings', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await PUT(new NextRequest('http://localhost/api/settings', { method: 'PUT' }));

    expect(response.status).toBe(401);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('returns 403 when a user lacks system.settings', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await PUT(new NextRequest('http://localhost/api/settings', { method: 'PUT' }));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'system.settings');
  });
});
