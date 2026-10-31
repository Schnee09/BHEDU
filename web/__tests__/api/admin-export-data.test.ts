/**
 * @jest-environment node
 */
import { GET } from '@/app/api/admin/export-data/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));

const tableQuery = { select: jest.fn(), limit: jest.fn(), insert: jest.fn() };
jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ from: jest.fn(() => tableQuery) })),
}));

function request(search = '') {
  return new Request(`http://localhost/api/admin/export-data${search}`);
}

function authorize() {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id: 'admin-1', email: 'admin@example.com' },
    role: 'admin',
  });
}

describe('GET /api/admin/export-data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tableQuery.select.mockReturnValue(tableQuery);
    tableQuery.limit.mockResolvedValue({ data: [], error: null });
    tableQuery.insert.mockResolvedValue({ error: null });
  });

  it('rejects an unknown module before authentication or data access', async () => {
    const response = await GET(request('?module=typo'));

    expect(response.status).toBe(400);
    expect(getAuthContext).not.toHaveBeenCalled();
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('requires database permission for a full export', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false, reason: 'Forbidden' });

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'system.database');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it.each(['audit_logs', 'school_settings', 'role_permission_overrides'])(
    'requires database permission for system table %s',
    async (table) => {
      authorize();

      const response = await GET(request(`?table=${table}`));

      expect(response.status).toBe(200);
      expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'system.database');
    }
  );

  it('uses report export permission for an operational table', async () => {
    authorize();

    const response = await GET(request('?table=profiles'));

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'reports.export');
    expect(tableQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'export',
        new_data: { scope: 'table:profiles', count: 0 },
      })
    );
  });

  it('does not expose database error details to the client', async () => {
    authorize();
    tableQuery.limit.mockResolvedValue({
      data: null,
      error: { message: 'relation profiles_internal_secret does not exist' },
    });

    const response = await GET(request('?table=profiles'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Không thể xuất dữ liệu bảng profiles');
    expect(JSON.stringify(body)).not.toContain('internal_secret');
  });
});
