/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/rate-limit/reset/route';
import { getAuthContext } from '@/lib/auth/guard';
import { clearAllRateLimits, resetRateLimit } from '@/lib/auth/rateLimit';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/rateLimit', () => ({
  clearAllRateLimits: jest.fn(),
  resetRateLimit: jest.fn(),
  cleanupRateLimits: jest.fn(() => 0),
  getRateLimitIdentifier: jest.fn(() => 'ip:test'),
}));

function request(body: unknown) {
  return new Request('http://localhost/api/admin/rate-limit/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/admin/rate-limit/reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });
  });

  it('uses the centralized permission guard', async () => {
    await POST(request({ all: true }));

    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'permissions.manage');
    expect(clearAllRateLimits).toHaveBeenCalledTimes(1);
  });

  it('rejects unauthorized requests without mutating rate limits', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false, reason: 'Forbidden' });

    const response = await POST(request({ all: true }));

    expect(response.status).toBe(401);
    expect(clearAllRateLimits).not.toHaveBeenCalled();
  });

  it('validates the requested identifier', async () => {
    const response = await POST(request({ identifier: { unexpected: true } }));

    expect(response.status).toBe(400);
    expect(resetRateLimit).not.toHaveBeenCalled();
  });

  it('trims and resets a specific identifier', async () => {
    const response = await POST(request({ identifier: '  login:user-1  ' }));

    expect(response.status).toBe(200);
    expect(resetRateLimit).toHaveBeenCalledWith('login:user-1');
    expect(await response.json()).toEqual({ success: true, message: 'Rate limit cleared' });
  });

  it('does not expose internal exception details', async () => {
    (clearAllRateLimits as jest.Mock).mockImplementation(() => {
      throw new Error('secret internal store path');
    });

    const response = await POST(request({ all: true }));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to reset rate limits' });
    expect(JSON.stringify(body)).not.toContain('secret internal store path');
  });
});
