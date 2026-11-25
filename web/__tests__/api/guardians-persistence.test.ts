/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/students/[id]/guardians/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { canAccessStudent } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
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
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessStudent).mockResolvedValue(true);

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

  it('requires students.view to read guardians', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-2' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(
      new Request('http://localhost/api/admin/students/student-1/guardians') as any,
      { params: Promise.resolve({ id: 'student-1' }) }
    );

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'students.view');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('requires students.edit to create a guardian', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(request({ name: 'Người giám hộ' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(Request), 'students.edit');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('rejects guardian creation outside the student scope', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessStudent).mockResolvedValue(false);

    const response = await POST(request({ name: 'Người giám hộ' }), {
      params: Promise.resolve({ id: 'student-1' }),
    });

    expect(response.status).toBe(403);
  });

  it('rejects guardian reads outside the student scope', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessStudent).mockResolvedValue(false);

    const response = await GET(
      new Request('http://localhost/api/admin/students/student-1/guardians') as any,
      { params: Promise.resolve({ id: 'student-1' }) }
    );

    expect(response.status).toBe(403);
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'teacher-1', role: 'teacher' },
      'student-1'
    );
  });
});
