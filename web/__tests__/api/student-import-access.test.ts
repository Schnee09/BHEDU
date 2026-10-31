/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/students/import/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';

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
});
