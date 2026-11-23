/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/enrollments/route';
import { canAccessClass } from '@/lib/auth/classAccess';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'staff-1', email: 'staff@example.com' },
    role: 'staff',
  }),
}));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const rpc = jest.fn();

function request() {
  const value: any = new Request('http://localhost/api/admin/enrollments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: '11111111-1111-4111-8111-111111111111',
      class_id: '22222222-2222-4222-8222-222222222222',
      enrollment_date: '2026-11-23',
    }),
  });
  value.nextUrl = new URL(value.url);
  return value;
}

describe('POST /api/admin/enrollments class scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createServiceClient).mockReturnValue({ rpc } as any);
    jest.mocked(canAccessClass).mockResolvedValue(false);
  });

  it('rejects enrollment into a class outside the assigned scope', async () => {
    const response = await POST(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'staff-1', role: 'staff' }),
      '22222222-2222-4222-8222-222222222222'
    );
    expect(rpc).not.toHaveBeenCalled();
  });
});
