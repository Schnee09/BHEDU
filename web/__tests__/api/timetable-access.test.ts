/**
 * @jest-environment node
 */
import { GET } from '@/app/api/timetable/route';
import { GET as GET_MY_TIMETABLE } from '@/app/api/timetable/my/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessClass, canAccessStudent } from '@/lib/auth/classAccess';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({
  canAccessClass: jest.fn(),
  canAccessStudent: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/TimetableRepository');

const classId = '123e4567-e89b-12d3-a456-426614174000';
const studentId = '223e4567-e89b-12d3-a456-426614174000';
const getSlots = jest.fn();

function request(search: string) {
  const req = new Request(`http://localhost/api/timetable${search}`) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('GET /api/timetable access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    });
    (canAccessClass as jest.Mock).mockResolvedValue(true);
    (canAccessStudent as jest.Mock).mockResolvedValue(true);
    getSlots.mockResolvedValue([]);
    (TimetableRepository as jest.Mock).mockImplementation(() => ({ getSlots }));
  });

  it('requires authentication', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false, reason: 'Unauthorized' });

    const response = await GET(request(`?class_id=${classId}`));

    expect(response.status).toBe(401);
    expect(getSlots).not.toHaveBeenCalled();
  });

  it.each([
    ['scoped timetable', GET, `?class_id=${classId}`],
    ['personal timetable', GET_MY_TIMETABLE, ''],
  ] as const)('requires timetable.view for the %s', async (_name, handler, search) => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    });

    const response = await handler(request(search));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'timetable.view');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('rejects access to an unassigned class', async () => {
    (canAccessClass as jest.Mock).mockResolvedValue(false);

    const response = await GET(request(`?class_id=${classId}`));

    expect(response.status).toBe(403);
    expect(getSlots).not.toHaveBeenCalled();
  });

  it('rejects access to an unrelated student', async () => {
    (canAccessStudent as jest.Mock).mockResolvedValue(false);

    const response = await GET(request(`?student_id=${studentId}`));

    expect(response.status).toBe(403);
    expect(getSlots).not.toHaveBeenCalled();
  });

  it('loads slots after all requested scopes are authorized', async () => {
    const response = await GET(request(`?class_id=${classId}&student_id=${studentId}`));

    expect(response.status).toBe(200);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
      classId
    );
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
      studentId
    );
    expect(getSlots).toHaveBeenCalledWith({
      class_id: classId,
      student_id: studentId,
      week_start_date: undefined,
    });
  });
});
