/**
 * @jest-environment node
 */
import { GET } from '@/app/api/timetable/route';
import { getAuthContext } from '@/lib/auth/guard';
import { canAccessClass, canAccessStudent } from '@/lib/auth/classAccess';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';

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
