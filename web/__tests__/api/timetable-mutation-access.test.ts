/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/timetable/route';
import { DELETE, PUT } from '@/app/api/timetable/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessTimetableSlot, canAccessTimetableTarget } from '@/lib/auth/classAccess';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({
  canAccessClass: jest.fn(),
  canAccessStudent: jest.fn(),
  canAccessTimetableSlot: jest.fn(),
  canAccessTimetableTarget: jest.fn(),
}));
jest.mock('@/lib/repositories/TimetableRepository');
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));

const SLOT_ID = '123e4567-e89b-42d3-a456-426614174000';
const context = { params: Promise.resolve({ id: SLOT_ID }) };
const slotPayload = {
  teacher_id: '223e4567-e89b-42d3-a456-426614174000',
  day_of_week: 1,
  start_time: '18:00',
  end_time: '19:30',
};

function request(path: string, method: string, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('timetable mutation authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['create', (req: NextRequest) => POST(req), request('/api/timetable', 'POST', slotPayload)],
    [
      'update',
      (req: NextRequest) => PUT(req, context),
      request(`/api/timetable/${SLOT_ID}`, 'PUT', { room: 'Phòng 2' }),
    ],
    [
      'delete',
      (req: NextRequest) => DELETE(req, context),
      request(`/api/timetable/${SLOT_ID}`, 'DELETE'),
    ],
  ] as const)('requires timetable.edit to %s a slot', async (_name, handler, req) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await handler(req);

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'timetable.edit');
    expect(TimetableRepository).not.toHaveBeenCalled();
  });

  it('rejects creating a slot outside the user scope', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessTimetableTarget).mockResolvedValue(false);

    const response = await POST(request('/api/timetable', 'POST', slotPayload));

    expect(response.status).toBe(403);
    expect(TimetableRepository).not.toHaveBeenCalled();
  });

  it('rejects deleting a slot outside the user scope', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessTimetableSlot).mockResolvedValue(false);

    const response = await DELETE(request(`/api/timetable/${SLOT_ID}`, 'DELETE'), context);

    expect(response.status).toBe(403);
    expect(TimetableRepository).toHaveBeenCalled();
  });
});
