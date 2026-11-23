/**
 * @jest-environment node
 */
import { GET } from '@/app/api/attendance/reports/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/repositories/AttendanceRepository', () => ({
  AttendanceRepository: jest.fn(),
}));

function request() {
  const value: any = new Request('http://localhost/api/attendance/reports');
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/attendance/reports access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
