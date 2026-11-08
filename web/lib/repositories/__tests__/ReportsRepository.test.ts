import { ReportsRepository } from '../ReportsRepository';

describe('ReportsRepository grade reports', () => {
  it('queries current grade columns and excludes soft-deleted rows', async () => {
    const query = {
      select: jest.fn(),
      is: jest.fn(),
      order: jest.fn(),
      eq: jest.fn(),
      limit: jest.fn(),
    };
    query.select.mockReturnValue(query);
    query.is.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.limit.mockResolvedValue({ data: [{ id: 'grade-1' }], error: null });

    const supabase = { from: jest.fn().mockReturnValue(query) } as any;
    const repository = new ReportsRepository(supabase);

    const result = await repository.getGradesReport({ limit: 50 });

    expect(supabase.from).toHaveBeenCalledWith('grades');
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('component_type'));
    expect(query.select).toHaveBeenCalledWith(expect.stringContaining('subject_id'));
    expect(query.select).toHaveBeenCalledWith(expect.not.stringContaining('evaluation_type'));
    expect(query.select).toHaveBeenCalledWith(
      expect.not.stringMatching(/points_earned,\s*max_points/)
    );
    expect(query.is).toHaveBeenCalledWith('deleted_at', null);
    expect(result).toEqual({ data: [{ id: 'grade-1' }] });
  });

  it('queries report-card grades using transitional semester aliases', async () => {
    const studentQuery = createQuery({
      data: { id: 'student-1', full_name: 'Nguyen Van A' },
      error: null,
    });
    const enrollmentQuery = createQuery({ data: null, error: null });
    const gradesQuery = createQuery({ data: [], error: null });
    const attendanceQuery = createQuery({ data: [], error: null });
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(studentQuery)
        .mockReturnValueOnce(enrollmentQuery)
        .mockReturnValueOnce(gradesQuery)
        .mockReturnValueOnce(attendanceQuery),
    } as any;

    await new ReportsRepository(supabase).getReportCard('student-1', {
      semesterId: '2026-2027-HK1',
    });

    expect(gradesQuery.in).toHaveBeenCalledWith('semester', ['1', '2026-2027-HK1']);
  });
});

function createQuery(result: { data: unknown; error: unknown }) {
  const query: Record<string, any> = { ...result };
  for (const method of ['select', 'eq', 'is', 'in']) {
    query[method] = jest.fn().mockReturnValue(query);
  }
  query.single = jest.fn().mockResolvedValue(result);
  query.maybeSingle = jest.fn().mockResolvedValue(result);
  query.order = jest.fn().mockResolvedValue(result);
  return query;
}
