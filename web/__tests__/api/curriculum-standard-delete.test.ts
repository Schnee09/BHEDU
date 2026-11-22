/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/curriculum-standards/[id]/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createClientFromRequest } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClientFromRequest: jest.fn() }));

const params = { params: Promise.resolve({ id: '11111111-1111-4111-8111-111111111111' }) };

describe('DELETE /api/curriculum-standards/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the dedicated curriculum.delete permission', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: false,
      profile: { id: 'teacher-1' },
      role: 'teacher',
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const response = await DELETE(
      new NextRequest('http://localhost/api/curriculum-standards/standard-1', {
        method: 'DELETE',
      }),
      params
    );

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), 'curriculum.delete');
    expect(createClientFromRequest).not.toHaveBeenCalled();
  });

  it('deletes the standard when the permission is granted dynamically', async () => {
    jest.mocked(getAuthContext).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1' },
      role: 'staff',
      isCustomOverride: true,
    } as Awaited<ReturnType<typeof getAuthContext>>);

    const existingQuery = {
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn().mockResolvedValue({
        data: { id: '11111111-1111-4111-8111-111111111111', title: 'Đại số' },
        error: null,
      }),
    };
    existingQuery.select.mockReturnValue(existingQuery);
    existingQuery.eq.mockReturnValue(existingQuery);

    const deleteQuery = {
      delete: jest.fn(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    deleteQuery.delete.mockReturnValue(deleteQuery);

    const from = jest.fn().mockReturnValueOnce(existingQuery).mockReturnValueOnce(deleteQuery);
    jest
      .mocked(createClientFromRequest)
      .mockReturnValue({ from } as unknown as ReturnType<typeof createClientFromRequest>);

    const response = await DELETE(
      new NextRequest('http://localhost/api/curriculum-standards/standard-1', {
        method: 'DELETE',
      }),
      params
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(deleteQuery.eq).toHaveBeenCalledWith('id', '11111111-1111-4111-8111-111111111111');
    expect(json.deleted_standard.title).toBe('Đại số');
  });
});
