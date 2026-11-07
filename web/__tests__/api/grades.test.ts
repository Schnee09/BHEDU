/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/grades/route';
import { canAccessClass } from '@/lib/auth/classAccess';

jest.mock('@/lib/auth/classAccess', () => ({ canAccessClass: jest.fn() }));

const ASSIGNED_CLASS_ID = '123e4567-e89b-12d3-a456-426614174000';
const OTHER_CLASS_ID = '323e4567-e89b-12d3-a456-426614174000';

const SUBJECT_ID = '423e4567-e89b-12d3-a456-426614174000';
const ASSIGNMENT_ID = '523e4567-e89b-12d3-a456-426614174000';

const classQuery = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() };
const assignmentQuery = { select: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn() };
const gradeQuery = {
  select: jest.fn(),
  is: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  in: jest.fn(),
  order: jest.fn(),
  range: jest.fn(),
  limit: jest.fn(),
  upsert: jest.fn(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === 'classes') return classQuery;
      if (table === 'assignments') return assignmentQuery;
      return gradeQuery;
    }),
  })),
}));

jest.mock('@/lib/auth/guard', () => ({
  getAuthContext: jest.fn().mockResolvedValue({
    authorized: true,
    profile: { id: 'teacher-1', email: 'teacher@example.com' },
    role: 'teacher',
  }),
}));

function createRequest(method: 'GET' | 'POST', search = '', body?: unknown) {
  const request: any = new Request(`http://localhost/api/grades${search}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  request.nextUrl = {
    pathname: '/api/grades',
    searchParams: new URLSearchParams(search.replace(/^\?/, '')),
  };
  return request;
}

describe('/api/grades authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    classQuery.select.mockReturnValue(classQuery);
    classQuery.eq.mockImplementation((field: string) =>
      field === 'teacher_id'
        ? Promise.resolve({ data: [{ id: ASSIGNED_CLASS_ID }], error: null })
        : classQuery
    );
    classQuery.maybeSingle.mockResolvedValue({ data: { subject_id: SUBJECT_ID }, error: null });
    assignmentQuery.select.mockReturnValue(assignmentQuery);
    assignmentQuery.eq.mockReturnValue(assignmentQuery);
    assignmentQuery.maybeSingle.mockResolvedValue({
      data: { class_id: ASSIGNED_CLASS_ID, max_points: 20 },
      error: null,
    });
    gradeQuery.select.mockReturnValue(gradeQuery);
    gradeQuery.is.mockReturnValue(gradeQuery);
    gradeQuery.eq.mockReturnValue(gradeQuery);
    gradeQuery.gte.mockReturnValue(gradeQuery);
    gradeQuery.in.mockReturnValue(gradeQuery);
    gradeQuery.order.mockReturnValue(gradeQuery);
    gradeQuery.range.mockResolvedValue({ data: [], error: null, count: 0 });
    gradeQuery.limit.mockReturnValue(gradeQuery);
    gradeQuery.upsert.mockReturnValue(gradeQuery);
    gradeQuery.single.mockResolvedValue({ data: { id: 'grade-1' }, error: null });
    gradeQuery.maybeSingle.mockResolvedValue({ data: null, error: null });
    (canAccessClass as jest.Mock).mockResolvedValue(true);
  });

  it('scopes an unfiltered teacher query to assigned classes', async () => {
    const response = await GET(createRequest('GET'), { params: Promise.resolve({}) } as any);

    expect(response.status).toBe(200);
    expect(gradeQuery.in).toHaveBeenCalledWith('class_id', [ASSIGNED_CLASS_ID]);
    expect(gradeQuery.range).toHaveBeenCalledWith(0, 24);
  });

  it('rejects a teacher requesting an unassigned class', async () => {
    const response = await GET(createRequest('GET', `?class_id=${OTHER_CLASS_ID}`), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(403);
    expect(gradeQuery.select).not.toHaveBeenCalled();
  });

  it('rejects a malformed student identifier before querying grades', async () => {
    const response = await GET(createRequest('GET', '?student_id=student-code%29%2Cstatus.eq.10'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(400);
    expect(gradeQuery.select).not.toHaveBeenCalled();
  });

  it('applies assignment and minimum score filters', async () => {
    const response = await GET(
      createRequest('GET', `?assignment_id=${ASSIGNMENT_ID}&min_score=7.5`),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(200);
    expect(gradeQuery.eq).toHaveBeenCalledWith('assignment_id', ASSIGNMENT_ID);
    expect(gradeQuery.gte).toHaveBeenCalledWith('score', 7.5);
  });

  it('reads both canonical and transitional semester codes', async () => {
    const response = await GET(createRequest('GET', '?semester=2026-2027-HK2'), {
      params: Promise.resolve({}),
    } as any);

    expect(response.status).toBe(200);
    expect(gradeQuery.in).toHaveBeenCalledWith('semester', ['2', '2026-2027-HK2']);
  });

  it('rejects creating a grade for an inaccessible class', async () => {
    (canAccessClass as jest.Mock).mockResolvedValue(false);
    const response = await POST(
      createRequest('POST', '', {
        student_id: '223e4567-e89b-12d3-a456-426614174000',
        class_id: OTHER_CLASS_ID,
        subject_id: '423e4567-e89b-12d3-a456-426614174000',
        score: 8,
        component_type: 'midterm',
        semester: '1',
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(403);
    expect(gradeQuery.in).not.toHaveBeenCalled();
  });

  it('restores a soft-deleted grade and records the authenticated grader', async () => {
    const response = await POST(
      createRequest('POST', '', {
        student_id: '223e4567-e89b-12d3-a456-426614174000',
        class_id: ASSIGNED_CLASS_ID,
        subject_id: '423e4567-e89b-12d3-a456-426614174000',
        score: 8,
        component_type: 'midterm',
        semester: '1',
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(200);
    expect(gradeQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        graded_by: 'teacher-1',
        deleted_at: null,
      }),
      { onConflict: 'student_id,class_id,subject_id,component_type,semester' }
    );
  });

  it('resolves assignment metadata and converts raw points to the 10-point scale', async () => {
    const response = await POST(
      createRequest('POST', '', {
        student_id: '223e4567-e89b-12d3-a456-426614174000',
        assignment_id: ASSIGNMENT_ID,
        points_earned: 15,
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(200);
    expect(assignmentQuery.select).toHaveBeenCalledWith('class_id, max_points');
    expect(gradeQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        assignment_id: ASSIGNMENT_ID,
        class_id: ASSIGNED_CLASS_ID,
        subject_id: SUBJECT_ID,
        points_earned: 15,
        score: 7.5,
      }),
      { onConflict: 'id' }
    );
  });

  it('restores the existing assignment grade instead of creating a duplicate', async () => {
    gradeQuery.maybeSingle.mockResolvedValueOnce({
      data: { id: 'existing-grade', deleted_at: '2026-11-01T00:00:00.000Z' },
      error: null,
    });

    const response = await POST(
      createRequest('POST', '', {
        student_id: '223e4567-e89b-12d3-a456-426614174000',
        assignment_id: ASSIGNMENT_ID,
        points_earned: 18,
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(200);
    expect(gradeQuery.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'existing-grade', deleted_at: null, score: 9 }),
      { onConflict: 'id' }
    );
  });

  it('updates existing rows when saving assignment grades in bulk', async () => {
    gradeQuery.in.mockResolvedValueOnce({
      data: [
        {
          id: 'deleted-grade',
          student_id: '223e4567-e89b-12d3-a456-426614174000',
          deleted_at: '2026-11-01T00:00:00.000Z',
        },
        {
          id: 'active-grade',
          student_id: '223e4567-e89b-12d3-a456-426614174000',
          deleted_at: null,
        },
      ],
      error: null,
    });

    const response = await POST(
      createRequest('POST', '', {
        assignment_id: ASSIGNMENT_ID,
        grades: [
          {
            student_id: '223e4567-e89b-12d3-a456-426614174000',
            points_earned: 16,
          },
        ],
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(200);
    expect(gradeQuery.upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ id: 'active-grade', deleted_at: null, score: 8 })],
      { onConflict: 'id' }
    );
  });

  it('rejects points above the assignment maximum', async () => {
    const response = await POST(
      createRequest('POST', '', {
        student_id: '223e4567-e89b-12d3-a456-426614174000',
        assignment_id: ASSIGNMENT_ID,
        points_earned: 21,
      }),
      { params: Promise.resolve({}) } as any
    );

    expect(response.status).toBe(400);
    expect(gradeQuery.upsert).not.toHaveBeenCalled();
  });
});
