/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as GET_ATTENDANCE } from '@/app/api/attendance/class/[classId]/route';
import { GET as GET_CANDIDATES } from '@/app/api/attendance/class/[classId]/candidates/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));

const CLASS_ID = '123e4567-e89b-42d3-a456-426614174000';
const context = { params: Promise.resolve({ classId: CLASS_ID }) };

describe('class attendance permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createServiceClient).mockReturnValue({} as never);
  });

  it.each([
    [
      'class attendance',
      GET_ATTENDANCE,
      new NextRequest(`http://localhost/api/attendance/class/${CLASS_ID}?date=2026-11-22`),
      'attendance.view',
    ],
    [
      'attendance candidates',
      GET_CANDIDATES,
      new NextRequest(
        `http://localhost/api/attendance/class/${CLASS_ID}/candidates?date=2026-11-22&search=an`
      ),
      'attendance.mark',
    ],
  ] as const)(
    'requires the explicit permission for %s',
    async (_name, handler, request, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'teacher-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request, context);

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
      expect(createServiceClient).not.toHaveBeenCalled();
      expect(canAccessClass).not.toHaveBeenCalled();
    }
  );

  it('rejects staff outside their assigned classes', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1' },
      role: 'staff',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessClass).mockResolvedValue(false);

    const response = await GET_ATTENDANCE(
      new NextRequest(`http://localhost/api/attendance/class/${CLASS_ID}?date=2026-11-22`),
      context
    );

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'staff-1', role: 'staff' },
      CLASS_ID
    );
  });
});
