/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/student-lookup/route';
import { getAuthContext } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { studentService } from '@/lib/services/studentService';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn(),
  rateLimitConfigs: { authStrict: { windowMs: 60_000, maxRequests: 5 } },
}));
jest.mock('@/lib/services/studentService', () => ({
  studentService: { getStudentByCode: jest.fn() },
}));

function request() {
  const req = new Request('http://localhost/api/auth/student-lookup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_code: 'HS20260001' }),
  }) as any;
  req.nextUrl = new URL(req.url);
  return req;
}

function authorize(role = 'parent') {
  (getAuthContext as jest.Mock).mockResolvedValue({
    authorized: true,
    profile: { id: 'user-1', email: 'user@example.com' },
    role,
  });
}

describe('POST /api/auth/student-lookup access control', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authorize();
    (checkRateLimit as jest.Mock).mockReturnValue({ allowed: true });
    (studentService.getStudentByCode as jest.Mock).mockResolvedValue({
      id: 'student-1',
      full_name: 'Nguyễn Văn A',
      email: 'private@example.com',
      student_code: 'HS20260001',
    });
  });

  it('requires authentication', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({ authorized: false, reason: 'Unauthorized' });

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(studentService.getStudentByCode).not.toHaveBeenCalled();
  });

  it('rejects roles that do not manage parent links', async () => {
    authorize('student');

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(studentService.getStudentByCode).not.toHaveBeenCalled();
  });

  it('rate limits lookups by authenticated account', async () => {
    (checkRateLimit as jest.Mock).mockReturnValue({ allowed: false });

    const response = await POST(request());

    expect(response.status).toBe(429);
    expect(checkRateLimit).toHaveBeenCalledWith('student-lookup:user-1', expect.anything());
    expect(studentService.getStudentByCode).not.toHaveBeenCalled();
  });

  it('returns only the fields needed to request a parent link', async () => {
    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      id: 'student-1',
      full_name: 'Nguyễn Văn A',
      student_code: 'HS20260001',
      role: 'student',
    });
    expect(JSON.stringify(body)).not.toContain('private@example.com');
  });
});
