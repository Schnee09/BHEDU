/**
 * @jest-environment node
 */
import { GET } from '@/app/api/attendance/reports/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { AttendanceRepository } from '@/lib/repositories/AttendanceRepository';
import { canAccessClass } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/repositories/AttendanceRepository', () => ({
  AttendanceRepository: jest.fn(),
}));

function request(search = '') {
  const value: any = new Request(`http://localhost/api/attendance/reports${search}`);
  value.nextUrl = new URL(value.url);
  return value;
}

function authenticate(role: string, id = `${role}-1`) {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id, email: `${id}@example.com` },
    role,
  });
}

describe('GET /api/attendance/reports access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createServiceClient as jest.Mock).mockReturnValue({});
    (AttendanceRepository as jest.Mock).mockImplementation(() => ({
      findAll: jest.fn().mockResolvedValue([]),
    }));
  });

  it('requires attendance.view before querying attendance records', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-1', email: 'student@example.com' },
      role: 'student',
    });

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'attendance.view');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('allows a custom role to view an assigned class only', async () => {
    authenticate('attendance_coordinator', 'coordinator-1');
    (canAccessClass as jest.Mock).mockResolvedValue(true);

    const response = await GET(request('?classId=class-1'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'coordinator-1', role: 'attendance_coordinator' },
      'class-1'
    );
  });

  it('requires a class scope for a custom operational role', async () => {
    authenticate('attendance_coordinator', 'coordinator-1');

    const response = await GET(request(), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(400);
    expect(canAccessClass).not.toHaveBeenCalled();
  });

  it('forces students to their own attendance records', async () => {
    authenticate('student', 'student-1');
    const findAll = jest.fn().mockResolvedValue([]);
    (AttendanceRepository as jest.Mock).mockImplementation(() => ({ findAll }));

    const response = await GET(request('?studentId=student-2'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ student_id: 'student-1' }));
    expect(canAccessClass).not.toHaveBeenCalled();
  });
});
