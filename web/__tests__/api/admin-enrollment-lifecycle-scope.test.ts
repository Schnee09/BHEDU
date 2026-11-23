/**
 * @jest-environment node
 */
import { PATCH } from '@/app/api/admin/enrollments/[id]/route';
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

const query: any = {
  select: jest.fn(),
  eq: jest.fn(),
  is: jest.fn(),
  maybeSingle: jest.fn(),
};
const rpc = jest.fn();
const from = jest.fn(() => query);
const context = { params: Promise.resolve({ id: 'enrollment-1' }) } as any;

function request(body: unknown) {
  const value: any = new Request('http://localhost/api/admin/enrollments/enrollment-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  value.nextUrl = new URL(value.url);
  return value;
}

describe('PATCH /api/admin/enrollments/[id] class scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.maybeSingle.mockResolvedValue({ data: { class_id: 'class-1' }, error: null });
    jest.mocked(createServiceClient).mockReturnValue({ from, rpc } as any);
  });

  it('rejects ending an enrollment outside the assigned classes', async () => {
    jest.mocked(canAccessClass).mockResolvedValue(false);

    const response = await PATCH(
      request({
        action: 'end',
        end_date: '2026-11-23',
        status: 'withdrawn',
        reason: 'Phụ huynh xác nhận nghỉ học',
      }),
      context
    );

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'staff-1', role: 'staff' }),
      'class-1'
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it('requires access to both source and destination classes for a transfer', async () => {
    jest.mocked(canAccessClass).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const response = await PATCH(
      request({
        action: 'transfer',
        to_class_id: '22222222-2222-4222-8222-222222222222',
        effective_date: '2026-11-23',
        reason: 'Chuyển sang lớp phù hợp lịch học',
      }),
      context
    );

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ id: 'staff-1', role: 'staff' }),
      '22222222-2222-4222-8222-222222222222'
    );
    expect(rpc).not.toHaveBeenCalled();
  });
});
