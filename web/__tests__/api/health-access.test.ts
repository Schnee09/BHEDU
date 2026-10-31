/**
 * @jest-environment node
 */
import { GET } from '@/app/api/health/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

function request() {
  return new Request('http://localhost/api/health') as any;
}

describe('GET /api/health access scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false });
  });

  it('returns lightweight liveness without privileged or outbound checks', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body).not.toHaveProperty('database');
    expect(body).not.toHaveProperty('external');
    expect(body).not.toHaveProperty('system');
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('checks explicit system permission before exposing diagnostics', async () => {
    await GET(request());

    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'system.settings');
  });
});
