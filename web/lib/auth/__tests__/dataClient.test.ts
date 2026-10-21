const createClient = jest.fn();
const createClientFromRequest = jest.fn();
const createClientFromToken = jest.fn();
const createServiceClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => createClient(...args),
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
  createClientFromToken: (...args: unknown[]) => createClientFromToken(...args),
  createServiceClient: (...args: unknown[]) => createServiceClient(...args),
}));

import { getDataClient } from '../dataClient';

function makeAuthClient(user: { id: string } | null, role: string | null) {
  const maybeSingle = jest.fn().mockResolvedValue({
    data: role ? { role } : null,
    error: null,
  });
  const or = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ or });

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: jest.fn().mockReturnValue({ select }),
  };
}

describe('getDataClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ignores forged identity headers and does not elevate an unauthenticated request', async () => {
    const authClient = makeAuthClient(null, null);
    createClientFromRequest.mockReturnValue(authClient);

    const request = new Request('https://example.test/api/data', {
      headers: {
        'x-user-role': 'admin',
        'x-user-id': 'forged-user',
      },
    });

    const result = await getDataClient(request);

    expect(result.user).toBeNull();
    expect(result.viewerRole).toBeNull();
    expect(result.usingServiceClient).toBe(false);
    expect(result.supabase).toBe(authClient);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('derives privilege from the verified user profile, not request headers', async () => {
    const authClient = makeAuthClient({ id: 'verified-user' }, 'student');
    createClientFromRequest.mockReturnValue(authClient);

    const request = new Request('https://example.test/api/data', {
      headers: {
        'x-user-role': 'owner',
        'x-user-id': 'forged-user',
      },
    });

    const result = await getDataClient(request);

    expect(result.user).toEqual({ id: 'verified-user' });
    expect(result.viewerRole).toBe('student');
    expect(result.usingServiceClient).toBe(false);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('verifies bearer tokens with the token-bound client', async () => {
    const tokenClient = makeAuthClient({ id: 'admin-user' }, 'admin');
    const serviceClient = { service: true };
    createClientFromToken.mockReturnValue(tokenClient);
    createServiceClient.mockReturnValue(serviceClient);

    const request = new Request('https://example.test/api/data', {
      headers: { authorization: 'Bearer valid-token' },
    });

    const result = await getDataClient(request);

    expect(createClientFromToken).toHaveBeenCalledWith('valid-token');
    expect(createClientFromRequest).not.toHaveBeenCalled();
    expect(result.usingServiceClient).toBe(true);
    expect(result.supabase).toBe(serviceClient);
  });
});
