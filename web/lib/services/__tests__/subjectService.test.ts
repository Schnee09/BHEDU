import { ValidationError } from '@/lib/api/errors';
import { SubjectService } from '@/lib/services/subjectService';

function createQuery(result: Record<string, unknown> = { data: null, error: null }) {
  const query: Record<string, any> = {};
  for (const method of ['select', 'eq', 'is', 'delete', 'update']) {
    query[method] = jest.fn().mockReturnValue(query);
  }
  query.then = (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  return query;
}

describe('SubjectService.deleteSubject', () => {
  it('only counts active grades when validating a soft delete', async () => {
    const grades = createQuery({ count: 1, error: null });
    const supabase = { from: jest.fn().mockReturnValue(grades) } as any;

    await expect(new SubjectService(supabase).deleteSubject('subject-1')).rejects.toBeInstanceOf(
      ValidationError
    );

    expect(grades.eq).toHaveBeenCalledWith('subject_id', 'subject-1');
    expect(grades.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('deletes all related grades during a hard delete even when none are active', async () => {
    const grades = createQuery({ count: 0, error: null });
    const timetable = createQuery();
    const subjects = createQuery();
    const supabase = {
      from: jest
        .fn()
        .mockReturnValueOnce(grades)
        .mockReturnValueOnce(grades)
        .mockReturnValueOnce(timetable)
        .mockReturnValueOnce(subjects),
    } as any;

    await new SubjectService(supabase).deleteSubject('subject-1', true);

    expect(grades.delete).toHaveBeenCalled();
    expect(grades.eq).toHaveBeenLastCalledWith('subject_id', 'subject-1');
    expect(timetable.delete).toHaveBeenCalled();
    expect(subjects.delete).toHaveBeenCalled();
  });

  it('stops a hard delete when removing related grades fails', async () => {
    const countQuery = createQuery({ count: 0, error: null });
    const gradesDelete = createQuery({
      data: null,
      error: { message: 'Cannot delete related grades' },
    });
    const supabase = {
      from: jest.fn().mockReturnValueOnce(countQuery).mockReturnValueOnce(gradesDelete),
    } as any;

    await expect(new SubjectService(supabase).deleteSubject('subject-1', true)).rejects.toEqual({
      message: 'Cannot delete related grades',
    });

    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(supabase.from).not.toHaveBeenCalledWith('timetable_slots');
    expect(supabase.from).not.toHaveBeenCalledWith('subjects');
  });
});
