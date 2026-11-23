/**
 * @jest-environment node
 */
import { DELETE, GET, PATCH } from '@/app/api/admin/attendance/[id]/route';
import { canAccessClass, canAccessStudent } from '@/lib/auth/classAccess';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1', email: 'teacher@example.com' },
    role: 'teacher',
  }),
}));
jest.mock('@/lib/auth/classAccess', () => ({
  canAccessClass: jest.fn(),
  canAccessStudent: jest.fn(),
}));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const query: any = {};
for (const method of ['select', 'eq', 'is']) {
  query[method] = jest.fn(() => query);
}
query.update = jest.fn(() => query);
query.single = jest.fn();
const from = jest.fn(() => query);

const context = { params: Promise.resolve({ id: 'attendance-1' }) } as any;

function request(method: 'GET' | 'PATCH' | 'DELETE') {
  const value: any = new Request('http://localhost/api/admin/attendance/attendance-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PATCH' ? JSON.stringify({ status: 'present' }) : undefined,
  });
  value.nextUrl = new URL(value.url);
  return value;
}

describe('admin attendance detail scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getDataClient).mockResolvedValue({ supabase: { from } } as any);
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.update.mockReturnValue(query);
    query.single.mockResolvedValue({
      data: {
        id: 'attendance-1',
        class_id: 'class-2',
        student_id: 'student-2',
      },
      error: null,
    });
    jest.mocked(canAccessClass).mockResolvedValue(false);
    jest.mocked(canAccessStudent).mockResolvedValue(false);
  });

  it.each([
    ['view', GET, 'GET'],
    ['update', PATCH, 'PATCH'],
    ['delete', DELETE, 'DELETE'],
  ] as const)('blocks %s outside the permitted scope', async (_name, handler, method) => {
    const response = await handler(request(method), context);

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
      'class-2'
    );
    expect(query.update).not.toHaveBeenCalled();
  });

  it('allows viewing a personally accessible student record', async () => {
    jest.mocked(canAccessStudent).mockResolvedValue(true);

    const response = await GET(request('GET'), context);

    expect(response.status).toBe(200);
    expect(canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'teacher-1', role: 'teacher' }),
      'student-2'
    );
  });
});
