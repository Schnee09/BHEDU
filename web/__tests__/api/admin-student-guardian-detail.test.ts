/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE, PUT } from '@/app/api/admin/students/[id]/guardians/[guardianId]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { canAccessStudent } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessStudent: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const guardianQuery: Record<string, jest.Mock> = {};
for (const method of ['select', 'eq', 'neq', 'update', 'delete']) {
  guardianQuery[method] = jest.fn(() => guardianQuery);
}
guardianQuery.maybeSingle = jest.fn();
guardianQuery.single = jest.fn();
const auditInsert = jest.fn().mockResolvedValue({ error: null });

const context = {
  params: Promise.resolve({ id: 'student-1', guardianId: 'guardian-1' }),
};

function request(method: 'PUT' | 'DELETE') {
  return new NextRequest('http://localhost/api/admin/students/student-1/guardians/guardian-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'PUT' ? JSON.stringify({ name: 'Người giám hộ A' }) : undefined,
  });
}

describe('/api/admin/students/[id]/guardians/[guardianId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(canAccessStudent).mockResolvedValue(true);
    for (const method of ['select', 'eq', 'neq', 'update', 'delete']) {
      guardianQuery[method]!.mockReturnValue(guardianQuery);
    }
    jest.mocked(getDataClient).mockResolvedValue({
      supabase: {
        from: jest.fn((table: string) =>
          table === 'audit_logs' ? { insert: auditInsert } : guardianQuery
        ),
      },
    } as unknown as Awaited<ReturnType<typeof getDataClient>>);
  });

  it('returns 401 when no authenticated profile is available', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: null,
      role: null,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await PUT(request('PUT'), context);

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'students.edit');
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('returns 403 when the profile lacks students.edit', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'student-2' },
      role: 'student',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await DELETE(request('DELETE'), context);

    expect(response.status).toBe(403);
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('records the authenticated profile when updating a guardian', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    guardianQuery.maybeSingle!.mockResolvedValue({
      data: { id: 'guardian-1', student_id: 'student-1' },
      error: null,
    });
    guardianQuery.single!.mockResolvedValue({
      data: { id: 'guardian-1', name: 'Người giám hộ A' },
      error: null,
    });

    const response = await PUT(request('PUT'), context);

    expect(response.status).toBe(200);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'admin-1',
        resource_id: 'guardian-1',
      })
    );
  });

  it.each([
    ['PUT', PUT],
    ['DELETE', DELETE],
  ] as const)('rejects %s outside the student scope', async (method, handler) => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    jest.mocked(canAccessStudent).mockResolvedValue(false);

    const response = await handler(request(method), context);

    expect(response.status).toBe(403);
    expect(guardianQuery.select).not.toHaveBeenCalled();
  });
});
