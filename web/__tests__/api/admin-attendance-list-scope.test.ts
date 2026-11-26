/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/attendance/route';
import { canAccessClass } from '@/lib/auth/classAccess';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const from = jest.fn();

function request(search = '') {
  const value: any = new Request(`http://localhost/api/admin/attendance${search}`);
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/admin/attendance scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getDataClient).mockResolvedValue({ supabase: { from } } as any);
  });

  it.each(['teacher', 'attendance_coordinator'])(
    'rejects %s filtering by an unassigned class',
    async (role) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: true,
        profile: { id: `${role}-1` },
        role,
      } as any);
      jest.mocked(canAccessClass).mockResolvedValue(false);

      const response = await GET(request('?class_id=class-2'));

      expect(response.status).toBe(403);
      expect(canAccessClass).toHaveBeenCalledWith(
        expect.anything(),
        { id: `${role}-1`, role },
        'class-2'
      );
      expect(from).not.toHaveBeenCalled();
    }
  );

  it('rejects a parent filtering by an unlinked student', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'parent-1' },
      role: 'parent',
    } as any);
    const linksQuery: any = {
      select: jest.fn(),
      eq: jest.fn(),
    };
    linksQuery.select.mockReturnValue(linksQuery);
    linksQuery.eq
      .mockReturnValueOnce(linksQuery)
      .mockResolvedValueOnce({ data: [{ student_id: 'student-1' }], error: null });
    from.mockReturnValue(linksQuery);

    const response = await GET(request('?student_id=student-2'));

    expect(response.status).toBe(403);
    expect(from).toHaveBeenCalledWith('parent_student_links');
  });
});
