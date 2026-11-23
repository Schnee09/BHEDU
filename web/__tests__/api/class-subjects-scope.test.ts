/**
 * @jest-environment node
 */
import { GET } from '@/app/api/classes/[classId]/subjects/route';
import { canAccessClass } from '@/lib/auth/classAccess';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1', email: 'teacher@example.com' },
    role: 'teacher',
  }),
}));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const from = jest.fn();

function request() {
  const value: any = new Request('http://localhost/api/classes/class-2/subjects');
  value.nextUrl = new URL(value.url);
  return value;
}

describe('GET /api/classes/[classId]/subjects scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(createServiceClient).mockReturnValue({ from } as any);
    jest.mocked(canAccessClass).mockResolvedValue(false);
  });

  it('rejects a class outside the teacher assignment before reading its subjects', async () => {
    const response = await GET(request(), {
      params: Promise.resolve({ classId: 'class-2' }),
    } as any);

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
      'class-2'
    );
    expect(from).not.toHaveBeenCalled();
  });
});
