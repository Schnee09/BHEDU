/**
 * @jest-environment node
 */
import { GET, PUT } from '@/app/api/admin/settings/route';
import { createServiceClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

// Mock auth guard to authorize super_admin
jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'mock-user-id', email: 'admin@bhedu.vn' },
    role: 'super_admin',
  }),
}));

describe('Admin Settings API (/api/admin/settings)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (method: string, body?: any) => {
    const init: any = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    const req: any = new Request('http://localhost/api/admin/settings', init);
    req.nextUrl = {
      pathname: '/api/admin/settings',
      searchParams: new URLSearchParams(),
    };
    return req;
  };

  it('GET returns settings successfully', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({
        data: [{ id: '1', key: 'school_name', value: 'Trung tâm BH' }],
        error: null,
      }),
    });
    (createServiceClient as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        select: mockSelect,
      }),
    });

    const req = createMockRequest('GET');
    const res: any = await GET(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].key).toBe('school_name');
  });

  it('PUT validates settings payload correctly', async () => {
    const req = createMockRequest('PUT', { settings: [] });
    const res: any = await PUT(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('PUT updates settings successfully with upsert', async () => {
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    const mockInsert = jest.fn().mockResolvedValue({ error: null });

    (createServiceClient as jest.Mock).mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'school_settings' || table === 'settings') {
          return { upsert: mockUpsert };
        }
        if (table === 'audit_logs') {
          return { insert: mockInsert };
        }
        return { upsert: mockUpsert, insert: mockInsert };
      }),
    });

    const req = createMockRequest('PUT', {
      settings: [
        { key: 'school_name', value: 'Bùi Hoàng Edu' },
        { key: 'school_address', value: 'TP.HCM' },
      ],
    });

    const res: any = await PUT(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
  });
});
