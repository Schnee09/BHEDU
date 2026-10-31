/**
 * @jest-environment node
 */
import { POST } from '@/app/api/calendar/reset/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

function request() {
  const req = new Request('http://localhost/api/calendar/reset', { method: 'POST' }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('POST /api/calendar/reset access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a teacher even when authentication succeeds', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'teacher-1', email: 'teacher@example.com' },
      role: 'teacher',
    });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'classes.manage');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('does not insert defaults when deleting existing events fails', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });

    const neq = jest.fn().mockResolvedValue({ error: new Error('delete failed') });
    const deleteQuery = { neq };
    const remove = jest.fn(() => deleteQuery);
    const insert = jest.fn();
    (createServiceClient as jest.Mock).mockReturnValue({
      from: jest.fn(() => ({ delete: remove, insert })),
    });

    const response = await POST(request());

    expect(response.status).toBe(500);
    expect(insert).not.toHaveBeenCalled();
  });
});
