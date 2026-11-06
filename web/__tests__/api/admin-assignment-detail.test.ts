/**
 * @jest-environment node
 */
import { DELETE, GET } from '@/app/api/admin/assignments/[id]/route';

const assignmentQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  single: jest.fn(),
  delete: jest.fn(),
};
const gradeQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  is: jest.fn(),
};

jest.mock('@/lib/auth/adminAuth', () => ({
  adminAuth: jest.fn().mockResolvedValue({ authorized: true, userId: 'admin-1' }),
}));

jest.mock('@/lib/auth/dataClient', () => ({
  getDataClient: jest.fn().mockResolvedValue({
    supabase: {
      from: jest.fn((table: string) => (table === 'grades' ? gradeQuery : assignmentQuery)),
    },
  }),
}));

const context = { params: Promise.resolve({ id: 'assignment-1' }) };

describe('/api/admin/assignments/[id] grade lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assignmentQuery.select.mockReturnValue(assignmentQuery);
    assignmentQuery.eq.mockReturnValue(assignmentQuery);
    assignmentQuery.delete.mockReturnValue(assignmentQuery);
    gradeQuery.select.mockReturnValue(gradeQuery);
    gradeQuery.eq.mockReturnValue(gradeQuery);
    gradeQuery.is.mockResolvedValue({ count: 0, error: null });
  });

  it('excludes soft-deleted grades from details and statistics', async () => {
    assignmentQuery.single.mockResolvedValue({
      data: {
        id: 'assignment-1',
        max_points: 20,
        grades: [
          { id: 'active', score: 8, graded_at: '2026-11-06T00:00:00.000Z', deleted_at: null },
          {
            id: 'deleted',
            score: 10,
            graded_at: '2026-11-06T00:00:00.000Z',
            deleted_at: '2026-11-06T01:00:00.000Z',
          },
        ],
      },
      error: null,
    });

    const response = await GET(
      new Request('http://localhost/api/admin/assignments/assignment-1'),
      context
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.assignment.grades).toHaveLength(1);
    expect(json.assignment.grades[0].id).toBe('active');
    expect(json.assignment.statistics).toEqual(
      expect.objectContaining({ total_submissions: 1, graded_submissions: 1, average_score: 8 })
    );
  });

  it('checks only active grades before deleting an assignment', async () => {
    assignmentQuery.single.mockResolvedValue({
      data: { id: 'assignment-1', title: 'Bài kiểm tra' },
      error: null,
    });
    assignmentQuery.eq
      .mockReturnValueOnce(assignmentQuery)
      .mockReturnValueOnce(Promise.resolve({ error: null }));

    const response = await DELETE(
      new Request('http://localhost/api/admin/assignments/assignment-1', { method: 'DELETE' }),
      context
    );

    expect(response.status).toBe(200);
    expect(gradeQuery.is).toHaveBeenCalledWith('deleted_at', null);
    expect(assignmentQuery.delete).toHaveBeenCalled();
  });
});
