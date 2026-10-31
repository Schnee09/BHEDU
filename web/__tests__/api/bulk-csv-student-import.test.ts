/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/bulk-import/route';
import { getAuthContext } from '@/lib/auth/guard';
import { createServiceClient } from '@/lib/supabase/server';
import { UserService } from '@/lib/services/userService';
import { StudentService } from '@/lib/services/studentService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/services/userService', () => ({ UserService: jest.fn() }));
jest.mock('@/lib/services/studentService', () => ({ StudentService: jest.fn() }));
jest.mock('@/lib/auditLog', () => ({ logAuditAction: jest.fn() }));

const createUser = jest.fn();
const enrollStudent = jest.fn();

function csvRequest() {
  const formData = new FormData();
  formData.set(
    'file',
    new File(
      [
        'full_name,email,phone,date_of_birth,class_id\n"Nguyễn, Văn An",an@example.com,0901234567,2010-05-15,class-1',
      ],
      'students.csv',
      { type: 'text/csv' }
    )
  );
  formData.set('type', 'students');
  return new Request('http://localhost/api/admin/bulk-import', {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/admin/bulk-import students', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
      isCustomOverride: true,
    });
    createUser.mockResolvedValue({ id: 'student-1' });
    enrollStudent.mockResolvedValue({ id: 'enrollment-1' });
    (UserService as unknown as jest.Mock).mockImplementation(() => ({ createUser }));
    (StudentService as unknown as jest.Mock).mockImplementation(() => ({ enrollStudent }));
  });

  it('uses delegated import permission and the canonical student services', async () => {
    const response = await POST(csvRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ success: 1, failed: 0 });
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'users.bulk_import');
    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Nguyễn, Văn An',
        email: 'an@example.com',
        phone: '0901234567',
        date_of_birth: '2010-05-15',
        role: 'student',
      }),
      'staff',
      'staff-1'
    );
    expect(enrollStudent).toHaveBeenCalledWith('student-1', 'class-1');
  });

  it('does not create privileged clients before authorization succeeds', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false, profile: null });

    const response = await POST(csvRequest());

    expect(response.status).toBe(401);
    expect(createServiceClient).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });
});
