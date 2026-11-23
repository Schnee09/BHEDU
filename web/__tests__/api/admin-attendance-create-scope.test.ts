/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/attendance/route';
import { canAccessClass } from '@/lib/auth/classAccess';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1' },
    role: 'teacher',
  }),
}));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const from = jest.fn();

function request() {
  const value = new Request('http://localhost/api/admin/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: '11111111-1111-4111-8111-111111111111',
      class_id: '22222222-2222-4222-8222-222222222222',
      date: '2026-11-23',
      status: 'present',
    }),
  }) as any;
  value.nextUrl = new URL(value.url);
  return value;
}

describe('POST /api/admin/attendance class scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getDataClient).mockResolvedValue({ supabase: { from } } as any);
    jest.mocked(canAccessClass).mockResolvedValue(false);
  });

  it('rejects attendance changes outside the assigned classes', async () => {
    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'teacher-1', role: 'teacher' },
      '22222222-2222-4222-8222-222222222222'
    );
    expect(from).not.toHaveBeenCalled();
  });
});
