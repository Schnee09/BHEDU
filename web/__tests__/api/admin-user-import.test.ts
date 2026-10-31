/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/users/import/route';
import { getAuthContext } from '@/lib/auth/guard';
import { userService } from '@/lib/services/userService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services/userService', () => ({
  userService: { createUser: jest.fn() },
}));

function request() {
  const req = new Request('http://localhost/api/admin/users/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      users: [
        {
          email: 'student@example.com',
          full_name: 'Nguyễn Văn An',
          role: 'student',
        },
      ],
    }),
  }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('POST /api/admin/users/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthContext as jest.Mock).mockResolvedValue({
      authorized: true,
      profile: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
      isCustomOverride: true,
    });
    (userService.createUser as jest.Mock).mockResolvedValue({ id: 'student-1' });
  });

  it('uses the delegated bulk-import permission', async () => {
    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'users.bulk_import');
  });

  it('passes the Vietnamese full name intact to UserService', async () => {
    await POST(request());

    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Nguyễn Văn An',
        role: 'student',
        status: 'active',
        is_managed: true,
      }),
      'staff',
      'staff-1'
    );
    const input = (userService.createUser as jest.Mock).mock.calls[0][0];
    expect(input).not.toHaveProperty('first_name');
    expect(input).not.toHaveProperty('last_name');
  });
});
