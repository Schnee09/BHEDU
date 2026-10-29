/**
 * @jest-environment node
 */
import {
  GET as getAssignments,
  POST as createAssignment,
} from '@/app/api/grades/assignments/route';
import { GET as getCategories } from '@/app/api/grades/categories/route';
import { canAccessClass } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));
jest.mock('@/lib/auth/adminAuth', () => ({
  teacherAuth: jest.fn().mockResolvedValue({
    authorized: true,
    userId: 'teacher-1',
    userRole: 'teacher',
  }),
}));

const query: Record<string, jest.Mock> = {};
for (const method of ['select', 'order', 'eq', 'lte', 'or', 'is', 'insert']) {
  query[method] = jest.fn(() => query);
}
query.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({ from: jest.fn(() => query) })),
}));

const CLASS_ID = '123e4567-e89b-12d3-a456-426614174000';

describe('grade configuration authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const method of ['select', 'order', 'eq', 'lte', 'or', 'is', 'insert']) {
      query[method]!.mockReturnValue(query);
    }
    (canAccessClass as jest.Mock).mockResolvedValue(false);
  });

  it('rejects listing assignments for an inaccessible class', async () => {
    const response = await getAssignments(
      new Request(`http://localhost/api/grades/assignments?classId=${CLASS_ID}`)
    );

    expect(response.status).toBe(403);
  });

  it('rejects creating an assignment for an inaccessible class', async () => {
    const response = await createAssignment(
      new Request('http://localhost/api/grades/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: CLASS_ID, title: 'Kiểm tra', total_points: 10 }),
      })
    );

    expect(response.status).toBe(403);
    expect(query.insert).not.toHaveBeenCalled();
  });

  it('rejects listing categories for an inaccessible class', async () => {
    const response = await getCategories(
      new Request(`http://localhost/api/grades/categories?classId=${CLASS_ID}`)
    );

    expect(response.status).toBe(403);
  });
});
