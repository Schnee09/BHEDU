/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/timetable/check-conflict/route';
import { getAuthContext } from '@/lib/auth/guard';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/repositories/TimetableRepository');
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));

const payload = {
  day_of_week: 1,
  start_time: '18:00',
  end_time: '19:30',
  room: 'Phòng 1',
};

function request() {
  return new NextRequest('http://localhost/api/timetable/check-conflict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

describe('POST /api/timetable/check-conflict authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires timetable.edit explicitly', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'timetable.edit');
  });

  it('allows a custom role granted timetable.edit dynamically', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'scheduler-1', email: 'scheduler@example.com' },
      role: 'scheduler',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    const checkConflicts = jest.fn().mockResolvedValue(null);
    jest.mocked(TimetableRepository).mockImplementation(
      () =>
        ({
          checkConflicts,
        }) as unknown as TimetableRepository
    );

    const response = await POST(request());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(checkConflicts).toHaveBeenCalledWith(expect.objectContaining(payload), undefined);
    expect(json.has_conflict).toBe(false);
  });
});
