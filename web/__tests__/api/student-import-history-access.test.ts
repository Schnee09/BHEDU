/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getHistory } from '@/app/api/admin/students/import/history/route';
import { GET as getErrors } from '@/app/api/admin/students/import/errors/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));

describe('student import history access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['history', getHistory, 'http://localhost/api/admin/students/import/history'],
    ['errors', getErrors, 'http://localhost/api/admin/students/import/errors'],
  ])('requires students.import for the %s endpoint', async (_name, handler, url) => {
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false, profile: null });

    const response = await handler(new NextRequest(url));

    expect(response.status).toBe(401);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'students.import');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('rejects unbounded history pagination before creating a service client', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    });

    const response = await getHistory(
      new NextRequest('http://localhost/api/admin/students/import/history?limit=1000')
    );

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('rejects malformed import log identifiers before creating a service client', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1' },
      role: 'admin',
    });

    const response = await getErrors(
      new NextRequest('http://localhost/api/admin/students/import/errors?import_log_id=not-a-uuid')
    );

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
