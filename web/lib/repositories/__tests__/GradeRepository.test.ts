import { GradeRepository } from '../GradeRepository';

function createQuery(result: Record<string, unknown> = { data: [], error: null, count: 0 }) {
  const query: any = {};
  for (const method of ['select', 'eq', 'is', 'range', 'order', 'update', 'delete', 'upsert']) {
    query[method] = jest.fn(() => query);
  }
  query.single = jest.fn().mockResolvedValue(result);
  query.then = (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(result));
  return query;
}

describe('GradeRepository soft-delete lifecycle', () => {
  it('excludes deleted grades from paginated results', async () => {
    const query = createQuery();
    const repository = new GradeRepository({ from: jest.fn(() => query) } as any);

    await repository.findAll();

    expect(query.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('updates active grades only', async () => {
    const query = createQuery({ data: { id: 'grade-1', score: 8 }, error: null });
    const repository = new GradeRepository({ from: jest.fn(() => query) } as any);

    await repository.update('grade-1', { score: 8 });

    expect(query.eq).toHaveBeenCalledWith('id', 'grade-1');
    expect(query.is).toHaveBeenCalledWith('deleted_at', null);
  });

  it('restores soft-deleted rows during bulk upsert', async () => {
    const query = createQuery({ data: [], error: null });
    const repository = new GradeRepository({ from: jest.fn(() => query) } as any);

    await repository.upsertMany([
      {
        student_id: 'student-1',
        class_id: 'class-1',
        subject_id: 'subject-1',
        component_type: 'midterm',
        semester: '1',
        score: 8,
      },
    ]);

    expect(query.upsert).toHaveBeenCalledWith([expect.objectContaining({ deleted_at: null })], {
      onConflict: 'student_id,class_id,subject_id,component_type,semester',
    });
  });

  it('soft deletes instead of removing a grade physically', async () => {
    const query = createQuery({ error: null });
    const repository = new GradeRepository({ from: jest.fn(() => query) } as any);

    await repository.delete('grade-1');

    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ deleted_at: expect.any(String) })
    );
    expect(query.delete).not.toHaveBeenCalled();
  });
});
