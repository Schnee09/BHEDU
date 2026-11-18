import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { POST } from '@/app/api/admin/create-user/route';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function createRequest(body: string, headers: Record<string, string>): Request {
  return {
    headers: new Headers(headers),
    text: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

describe('POST /api/admin/create-user', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      INTERNAL_API_KEY: 'internal-test-key',
    };

    mockedCreateClient.mockReturnValue({
      auth: {
        admin: {
          createUser: jest.fn().mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
        },
      },
    } as unknown as ReturnType<typeof createClient>);
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('does not let unsigned requests exhaust the trusted caller rate limit', async () => {
    const body = JSON.stringify({ email: 'teacher@example.com', password: 'SecurePass123!' });

    for (let attempt = 0; attempt < 11; attempt += 1) {
      const unsignedResponse = await POST(
        createRequest(body, { 'x-forwarded-for': '203.0.113.10' })
      );

      expect(unsignedResponse.status).toBe(401);
    }

    const signature = crypto
      .createHmac('sha256', process.env.INTERNAL_API_KEY!)
      .update(body)
      .digest('hex');
    const signedResponse = await POST(
      createRequest(body, {
        'x-forwarded-for': '203.0.113.10',
        'x-internal-signature': signature,
      })
    );

    expect(signedResponse.status).toBe(200);
    expect(mockedCreateClient).toHaveBeenCalledTimes(1);
  });
});
