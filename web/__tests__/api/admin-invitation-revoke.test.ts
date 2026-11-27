/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/admin/invitations/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

const invitationId = '11111111-1111-4111-8111-111111111111';
const context = { params: Promise.resolve({ id: invitationId }) };

function request() {
  return new NextRequest(`http://localhost/api/admin/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}

function mockInvitation(role: string, usedAt: string | null = null) {
  const selectQuery = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  };
  selectQuery.select.mockReturnValue(selectQuery);
  selectQuery.eq.mockReturnValue(selectQuery);
  selectQuery.maybeSingle.mockResolvedValue({
    data: { id: invitationId, role, used_at: usedAt },
    error: null,
  });

  const deleteQuery = {
    delete: jest.fn(),
    eq: jest.fn(),
  };
  deleteQuery.delete.mockReturnValue(deleteQuery);
  deleteQuery.eq.mockResolvedValue({ error: null });

  const from = jest.fn().mockReturnValueOnce(selectQuery).mockReturnValueOnce(deleteQuery);
  jest.mocked(createServiceClient).mockReturnValue({
    from,
  } as unknown as ReturnType<typeof createServiceClient>);
  return { from, deleteQuery };
}

describe('DELETE /api/admin/invitations/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@bhedu.vn' },
      role: 'admin',
    } as Awaited<ReturnType<typeof getAuthContext>>);
  });

  it('revokes an unused invitation within the administrator hierarchy', async () => {
    const { deleteQuery } = mockInvitation('teacher');

    const response = await DELETE(request(), context);

    expect(response.status).toBe(200);
    expect(deleteQuery.delete).toHaveBeenCalled();
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', invitationId);
  });

  it('prevents an administrator from revoking an owner invitation', async () => {
    const { from, deleteQuery } = mockInvitation('owner');

    const response = await DELETE(request(), context);

    expect(response.status).toBe(403);
    expect(from).toHaveBeenCalledTimes(1);
    expect(deleteQuery.delete).not.toHaveBeenCalled();
  });

  it('preserves an invitation that has already been used', async () => {
    const { from, deleteQuery } = mockInvitation('teacher', '2026-11-27T10:00:00.000Z');

    const response = await DELETE(request(), context);

    expect(response.status).toBe(409);
    expect(from).toHaveBeenCalledTimes(1);
    expect(deleteQuery.delete).not.toHaveBeenCalled();
  });

  it('rejects malformed invitation IDs before accessing the database', async () => {
    const response = await DELETE(request(), {
      params: Promise.resolve({ id: 'not-a-uuid' }),
    });

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
