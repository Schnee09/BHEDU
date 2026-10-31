/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/admin/users/route';
import { getAuthContext } from '@/lib/auth/guard';
import { UserRepository } from '@/lib/repositories/UserRepository';
import { userService } from '@/lib/services/userService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/repositories/UserRepository');
jest.mock('@/lib/services/userService', () => ({
  userService: { createUser: jest.fn() },
}));

const findAll = jest.fn();
const getStatistics = jest.fn();

function authorizeStaff() {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id: 'staff-1', email: 'staff@example.com' },
    role: 'staff',
    isCustomOverride: true,
  });
}

function getRequest() {
  const req = new Request('http://localhost/api/admin/users') as any;
  req.nextUrl = new URL(req.url);
  return req;
}

function postRequest() {
  const req = new Request('http://localhost/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'student', full_name: 'Nguyễn Văn A' }),
  }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

describe('/api/admin/users centralized permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorizeStaff();
    findAll.mockResolvedValue({ data: [], page: 1, pageSize: 50, total: 0 });
    getStatistics.mockResolvedValue({});
    (UserRepository as jest.Mock).mockImplementation(() => ({ findAll, getStatistics }));
    (userService.createUser as jest.Mock).mockResolvedValue({
      id: 'student-1',
      role: 'student',
    });
  });

  it('honors a users.view grant without a second role-only check', async () => {
    const response = await GET(getRequest());

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'users.view');
    expect(findAll).toHaveBeenCalledTimes(1);
  });

  it('honors a users.create grant while retaining service-level role protection', async () => {
    const response = await POST(postRequest());

    expect(response.status).toBe(200);
    expect(getAuthContext).toHaveBeenCalledWith(expect.anything(), 'users.create');
    expect(userService.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'student', full_name: 'Nguyễn Văn A' }),
      'staff',
      'staff-1'
    );
  });
});
