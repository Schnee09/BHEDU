/**
 * @jest-environment node
 */
import { POST } from '@/app/api/timetable/check-conflict/route';
import { canAccessTimetableSlot, canAccessTimetableTarget } from '@/lib/auth/classAccess';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1', email: 'teacher@example.com' },
    role: 'teacher',
  }),
}));
jest.mock('@/lib/auth/classAccess', () => ({
  canAccessTimetableSlot: jest.fn(),
  canAccessTimetableTarget: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/TimetableRepository', () => ({
  TimetableRepository: jest.fn(),
}));

function request(body: Record<string, unknown>) {
  const value: any = new Request('http://localhost/api/timetable/check-conflict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day_of_week: 1,
      start_time: '18:00',
      end_time: '19:30',
      ...body,
    }),
  });
  value.nextUrl = new URL(value.url);
  return value;
}

describe('POST /api/timetable/check-conflict scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(canAccessTimetableSlot).mockResolvedValue(true);
    jest.mocked(canAccessTimetableTarget).mockResolvedValue(true);
  });

  it('rejects an excluded slot outside the permitted scope', async () => {
    jest.mocked(canAccessTimetableSlot).mockResolvedValue(false);

    const response = await POST(
      request({
        class_id: '11111111-1111-4111-8111-111111111111',
        exclude_slot_id: '22222222-2222-4222-8222-222222222222',
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(403);
    expect(canAccessTimetableTarget).not.toHaveBeenCalled();
    expect(TimetableRepository).not.toHaveBeenCalled();
  });

  it('rejects a timetable target outside the permitted scope', async () => {
    jest.mocked(canAccessTimetableTarget).mockResolvedValue(false);

    const response = await POST(request({ class_id: '11111111-1111-4111-8111-111111111111' }), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(403);
    expect(canAccessTimetableTarget).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
      expect.objectContaining({ classId: '11111111-1111-4111-8111-111111111111' })
    );
    expect(TimetableRepository).not.toHaveBeenCalled();
  });
});
