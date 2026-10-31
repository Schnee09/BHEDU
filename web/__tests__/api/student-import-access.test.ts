/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/students/import/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { UserService } from '@/lib/services/userService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn() }));
jest.mock('@/lib/services/userService', () => ({ UserService: jest.fn() }));

function request(students: unknown[]) {
  return new Request('http://localhost/api/admin/students/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students }),
  }) as any;
}

describe('POST /api/admin/students/import access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires the students.import permission before creating a service client', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: false,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
      reason: 'Forbidden',
    });

    const response = await POST(request([{ firstName: 'An', lastName: 'Nguyễn' }]));

    expect(response.status).toBe(403);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'students.import');
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('rejects oversized batches before creating a service client', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });
    const students = Array.from({ length: 1001 }, (_, index) => ({
      firstName: `Tên ${index}`,
      lastName: 'Nguyễn',
    }));

    const response = await POST(request(students));

    expect(response.status).toBe(400);
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('rejects malformed student rows before creating a service client', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });

    const response = await POST(
      request([{ firstName: 'An', lastName: 'Nguyễn', email: 'khong-hop-le' }])
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ error: 'Dữ liệu nhập học sinh không hợp lệ' });
    expect(body.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'students.0.email', message: 'Email không hợp lệ' }),
      ])
    );
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('stores sanitized failures and finalizes the import log', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'admin-1', email: 'admin@example.com' },
      role: 'admin',
    });

    const updateLog = jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) }));
    const insertImportError = jest.fn().mockResolvedValue({ error: null });
    const insertAudit = jest.fn().mockResolvedValue({ error: null });
    let importLogCalls = 0;
    const from = jest.fn((table: string) => {
      if (table === 'import_logs' && importLogCalls++ === 0) {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({ data: { id: 'log-1' }, error: null }),
            })),
          })),
        };
      }
      if (table === 'import_logs') return { update: updateLog };
      if (table === 'import_errors') return { insert: insertImportError };
      if (table === 'audit_logs') return { insert: insertAudit };
      throw new Error(`Unexpected table: ${table}`);
    });
    (createServiceClient as jest.Mock).mockReturnValue({ from });
    (UserService as unknown as jest.Mock).mockImplementation(() => ({
      createUser: jest.fn().mockRejectedValue(new Error('sensitive database detail')),
    }));

    const response = await POST(
      request([{ firstName: 'An', lastName: 'Nguyễn Văn', studentId: 'HS001' }])
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.results.errors[0].error).toBe('Không thể tạo hồ sơ học sinh');
    expect(insertImportError).toHaveBeenCalledWith(
      expect.not.objectContaining({ row_data: expect.anything() })
    );
    expect(insertImportError).toHaveBeenCalledWith(
      expect.objectContaining({ error_message: 'Không thể tạo hồ sơ học sinh' })
    );
    expect(updateLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        processed_rows: 1,
        warning_count: 0,
        completed_at: expect.any(String),
        duration_seconds: expect.any(Number),
      })
    );
  });
});
