/**
 * @jest-environment node
 */
import { POST } from '@/app/api/grades/vietnamese-entry/route';
import { gradeService } from '@/lib/services/gradeService';
import { EvaluationType } from '@/lib/grades/types';

jest.mock('@/lib/services/gradeService', () => ({
  gradeService: {
    saveGrades: jest.fn(),
  },
}));

// Mock auth guard to bypass 401
jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'mock-user-id', email: 'test@example.com' },
    role: 'teacher', // valid role for the endpoint
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  logRequest: jest.fn(),
  logResponse: jest.fn(),
}));

describe('POST /api/grades/vietnamese-entry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: any) => {
    const req: any = new Request('http://localhost/api/grades/vietnamese-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    req.nextUrl = {
      pathname: '/api/grades/vietnamese-entry',
      searchParams: new URLSearchParams(),
    };
    return req;
  };

  it('rejects invalid array or missing items', async () => {
    const req = createMockRequest({ class_id: 'class-1' });

    const res: any = await POST(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false); // apiHandler returns { success: false, error: ... }
  });

  it('calls gradeService.saveGrades with properly mapped data', async () => {
    (gradeService.saveGrades as jest.Mock).mockResolvedValue({ count: 1 });

    const req = createMockRequest({
      class_id: 'class-123',
      semester: 'HK1',
      students: [
        {
          student_id: 'student-123',
          grades: {
            [EvaluationType.MIDTERM]: 8.5,
            [EvaluationType.FINAL]: 9.0,
          },
        },
      ],
    });

    const res: any = await POST(req, { params: Promise.resolve({}) } as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(gradeService.saveGrades).toHaveBeenCalledWith({
      class_id: 'class-123',
      subject_code: 'class-123', // falls back to class_id if not provided
      semester: 'HK1',
      students: [
        {
          student_id: 'student-123',
          grades: {
            [EvaluationType.MIDTERM]: 8.5,
            [EvaluationType.FINAL]: 9.0,
          },
        },
      ],
    });
  });
});
