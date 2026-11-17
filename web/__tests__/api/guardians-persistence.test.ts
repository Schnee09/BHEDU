/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/students/[id]/guardians/route';
import { adminAuth } from '@/lib/auth/adminAuth';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/adminAuth', () => ({ adminAuth: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

function request(body: unknown) {
  return new Request('http://localhost/api/admin/students/student-1/guardians', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('guardian persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminAuth as jest.Mock).mockResolvedValue({ authorized: true });

    const profiles = {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'student-1' }, error: null }),
          })),
        })),
      })),
    };
    const guardians = {
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'relation guardians does not exist' },
          }),
        })),
      })),
    };

    (getDataClient as jest.Mock).mockResolvedValue({
      supabase: {
        from: jest.fn((table: string) => (table === 'profiles' ? profiles : guardians)),
      },
    });
  });

  it('returns an error instead of a temporary success record when storage fails', async () => {
    const response = await POST(request({ name: 'Nguyễn Văn Bình', phone: '0901234567' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.data).toBeUndefined();
    expect(JSON.stringify(json)).not.toContain('temp-');
  });
});
