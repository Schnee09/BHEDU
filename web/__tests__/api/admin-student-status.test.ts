/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/students/[id]/status/route';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/dataClient', () => ({ getDataClient: jest.fn() }));

const profileQuery: Record<string, jest.Mock> = {};
for (const method of ['select', 'eq', 'update']) {
  profileQuery[method] = jest.fn(() => profileQuery);
}
profileQuery.maybeSingle = jest.fn();
profileQuery.single = jest.fn();
const auditInsert = jest.fn().mockResolvedValue({ error: null });

const context = { params: Promise.resolve({ id: 'student-1' }) };

function request() {
  return new NextRequest('http://localhost/api/admin/students/student-1/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'inactive', reason: 'Tạm nghỉ' }),
  });
}

describe('PATCH /api/admin/students/[id]/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const method of ['select', 'eq', 'update']) {
      profileQuery[method]!.mockReturnValue(profileQuery);
    }
    jest.mocked(getDataClient).mockResolvedValue({
      supabase: {
        from: jest.fn((table: string) =>
          table === 'audit_logs' ? { insert: auditInsert } : profileQuery
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

    const response = await PATCH(request(), context);

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

    const response = await PATCH(request(), context);

    expect(response.status).toBe(403);
    expect(getDataClient).not.toHaveBeenCalled();
  });

  it('records the authenticated profile in the audit log', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
    profileQuery.maybeSingle!.mockResolvedValue({
      data: { id: 'student-1', role: 'student', status: 'active', full_name: 'Học sinh A' },
      error: null,
    });
    profileQuery.single!.mockResolvedValue({
      data: { id: 'student-1', status: 'inactive' },
      error: null,
    });

    const response = await PATCH(request(), context);

    expect(response.status).toBe(200);
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_id: 'admin-1',
        resource_id: 'student-1',
        details: expect.objectContaining({ previous_status: 'active', new_status: 'inactive' }),
      })
    );
  });
});
