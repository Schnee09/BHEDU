/**
 * @jest-environment node
 */
import { POST } from '@/app/api/admin/assignments/route';

const assignmentQuery = {
  insert: jest.fn(),
  select: jest.fn(),
  single: jest.fn(),
};
const classQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
};
const categoryQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  maybeSingle: jest.fn(),
};

jest.mock('@/lib/auth/adminAuth', () => ({
  adminAuth: jest.fn().mockResolvedValue({ authorized: true, userId: 'admin-1' }),
}));

jest.mock('@/lib/auth/dataClient', () => ({
  getDataClient: jest.fn().mockResolvedValue({
    supabase: {
      from: jest.fn((table: string) => {
        if (table === 'classes') return classQuery;
        if (table === 'assignment_categories') return categoryQuery;
        return assignmentQuery;
      }),
    },
  }),
}));

function createRequest(body: Record<string, unknown>) {
  const request: any = new Request('http://localhost/api/admin/assignments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  request.nextUrl = { pathname: '/api/admin/assignments', searchParams: new URLSearchParams() };
  return request;
}

describe('POST /api/admin/assignments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    assignmentQuery.insert.mockReturnValue(assignmentQuery);
    assignmentQuery.select.mockReturnValue(assignmentQuery);
    assignmentQuery.single.mockResolvedValue({
      data: { id: 'assignment-1', title: 'Kiểm tra', max_points: 20 },
      error: null,
    });
    classQuery.select.mockReturnValue(classQuery);
    classQuery.eq.mockReturnValue(classQuery);
    classQuery.maybeSingle.mockResolvedValue({ data: { id: 'class-1' }, error: null });
    categoryQuery.select.mockReturnValue(categoryQuery);
    categoryQuery.eq.mockReturnValue(categoryQuery);
    categoryQuery.maybeSingle.mockResolvedValue({ data: { id: 'category-1' }, error: null });
  });

  it('accepts total_points and stores it as max_points', async () => {
    const response = await POST(
      createRequest({ class_id: 'class-1', title: '  Kiểm tra  ', total_points: 20 })
    );

    expect(response.status).toBe(200);
    expect(assignmentQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({ class_id: 'class-1', title: 'Kiểm tra', max_points: 20 })
    );
    await expect(response.json()).resolves.toMatchObject({
      data: { max_points: 20, total_points: 20 },
    });
  });

  it('rejects a non-positive point scale before inserting', async () => {
    const response = await POST(
      createRequest({ class_id: 'class-1', title: 'Kiểm tra', max_points: 0 })
    );

    expect(response.status).toBe(400);
    expect(assignmentQuery.insert).not.toHaveBeenCalled();
  });

  it('rejects a category that does not belong to the selected class', async () => {
    categoryQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

    const response = await POST(
      createRequest({
        class_id: 'class-1',
        category_id: 'category-other',
        title: 'Kiểm tra',
        total_points: 10,
      })
    );

    expect(response.status).toBe(400);
    expect(categoryQuery.eq).toHaveBeenCalledWith('class_id', 'class-1');
    expect(assignmentQuery.insert).not.toHaveBeenCalled();
  });
});
