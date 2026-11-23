/**
 * @jest-environment node
 */
import { DELETE } from '@/app/api/grades/[id]/route';
import { canAccessClass } from '@/lib/auth/classAccess';

const findById = jest.fn();
const deleteGrade = jest.fn();

jest.mock('@/lib/repositories/GradeRepository', () => ({
  GradeRepository: jest.fn().mockImplementation(() => ({
    findById,
    delete: deleteGrade,
  })),
}));
jest.mock('@/lib/supabase/server', () => ({ createServiceClient: jest.fn(() => ({})) }));
jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1' },
    role: 'teacher',
  }),
}));
jest.mock('@/lib/auth/rateLimit', () => ({
  checkRateLimit: jest.fn(() => ({ allowed: true })),
  getRateLimitIdentifier: jest.fn(() => 'test'),
  rateLimitConfigs: { api: {} },
}));

const context = { params: Promise.resolve({ id: 'grade-1' }) };

function request() {
  return new Request('http://localhost/api/grades/grade-1', { method: 'DELETE' }) as any;
}

describe('DELETE /api/grades/[id] class scope', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findById.mockResolvedValue({ id: 'grade-1', class_id: 'class-1' });
  });

  it('does not delete a grade outside the teacher assigned classes', async () => {
    jest.mocked(canAccessClass).mockResolvedValue(false);

    const response = await DELETE(request(), context);

    expect(response.status).toBe(403);
    expect(canAccessClass).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'teacher-1', role: 'teacher' },
      'class-1'
    );
    expect(deleteGrade).not.toHaveBeenCalled();
  });

  it('deletes a grade from an assigned class', async () => {
    jest.mocked(canAccessClass).mockResolvedValue(true);
    deleteGrade.mockResolvedValue(undefined);

    const response = await DELETE(request(), context);

    expect(response.status).toBe(200);
    expect(deleteGrade).toHaveBeenCalledWith('grade-1');
  });
});
