/**
 * @jest-environment node
 */
import { PATCH } from '@/app/api/grades/[id]/route';
import { canAccessClass } from '@/lib/auth/classAccess';

const findById = jest.fn();
const update = jest.fn();

jest.mock('@/lib/repositories/GradeRepository', () => ({
  GradeRepository: jest.fn().mockImplementation(() => ({ findById, update })),
}));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/adminAuth', () => ({
  teacherAuth: jest.fn().mockResolvedValue({
    authorized: true,
    userId: 'teacher-1',
    userRole: 'teacher',
  }),
  adminAuth: jest.fn(),
}));
jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  getRateLimitIdentifier: jest.fn(() => 'test'),
  rateLimitConfigs: { api: {} },
}));

function request(body: unknown) {
  return new Request('http://localhost/api/grades/grade-1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as any;
}

describe('PATCH /api/grades/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findById.mockResolvedValue({ id: 'grade-1', class_id: 'class-1' });
    update.mockResolvedValue({ id: 'grade-1', score: 8, points_earned: 8, feedback: 'Tiến bộ' });
    (canAccessClass as jest.Mock).mockResolvedValue(true);
  });

  it('normalizes score and the notes alias to stored grade fields', async () => {
    const response = await PATCH(request({ score: 8, notes: 'Tiến bộ' }), {
      params: Promise.resolve({ id: 'grade-1' }),
    });

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith('grade-1', {
      score: 8,
      points_earned: 8,
      feedback: 'Tiến bộ',
    });
  });

  it('rejects fields that do not exist in the grades table', async () => {
    const response = await PATCH(request({ max_score: 10 }), {
      params: Promise.resolve({ id: 'grade-1' }),
    });

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
