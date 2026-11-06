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
});
