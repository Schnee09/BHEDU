/**
 * @jest-environment node
 */
import { createGetHandler } from '@/lib/api/apiHandler';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const endpoint = jest.fn(async () => Response.json({ success: true }));
const GET = createGetHandler({ permission: 'users.view' }, endpoint);

function request() {
  const req = new Request('http://localhost/api/test') as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('createApiHandler authorization status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when no authenticated profile exists', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
      reason: 'Unauthorized: login required',
    });

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(endpoint).not.toHaveBeenCalled();
  });

  it('returns 403 when an authenticated profile lacks permission', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
      reason: "Forbidden: missing permission 'users.view'",
    });

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.code).toBe('AUTHORIZATION_ERROR');
    expect(endpoint).not.toHaveBeenCalled();
  });

  it('executes the endpoint after successful authorization', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(endpoint).toHaveBeenCalledTimes(1);
  });
});
