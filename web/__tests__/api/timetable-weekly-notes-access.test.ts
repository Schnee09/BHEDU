/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/timetable/weekly-notes/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessTimetableSlot } from '@/lib/auth/classAccess';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessTimetableSlot: jest.fn() }));
jest.mock('@/lib/repositories/TimetableRepository');
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));

const SLOT_ID = '123e4567-e89b-42d3-a456-426614174000';

describe('/api/timetable/weekly-notes authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires timetable.edit before loading a note', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await GET(
      new NextRequest(
        `http://localhost/api/timetable/weekly-notes?slot_id=${SLOT_ID}&week_start_date=2026-11-16`
      )
    );

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'timetable.edit');
    expect(canAccessTimetableSlot).not.toHaveBeenCalled();
  });

  it('rejects editing a note outside the authenticated user scope', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessTimetableSlot).mockResolvedValue(false);

    const response = await POST(
      new NextRequest('http://localhost/api/timetable/weekly-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: SLOT_ID,
          week_start_date: '2026-11-16',
          notes: 'Ôn tập chương 2',
        }),
      })
    );

    expect(response.status).toBe(403);
    expect(canAccessTimetableSlot).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
      SLOT_ID
    );
    expect(TimetableRepository).not.toHaveBeenCalled();
  });
});
