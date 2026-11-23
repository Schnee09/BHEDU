/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/grades/route';
import { canAccessClass } from '@/lib/auth/classAccess';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1' },
    role: 'teacher',
  }),
}));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const from = jest.fn();

function request() {
  const value: any = new Request('http://localhost/api/admin/grades', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: 'student-1',
      class_id: 'class-2',
      subject_id: 'subject-1',
      component_type: 'midterm',
      semester: '1',
      score: 8,
    }),
  });
  value.nextUrl = new URL(value.url);
  return value;
}

describe('POST /api/admin/grades class scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getDataClient).mockResolvedValue({ supabase: { from } } as any);
    jest.mocked(canAccessClass).mockResolvedValue(false);
  });

  it('rejects grade changes outside the assigned classes', async () => {
    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'teacher-1', role: 'teacher' },
      'class-2'
    );
    expect(from).not.toHaveBeenCalled();
  });
});
