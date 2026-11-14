import { ClassRepository } from '../ClassRepository';

function query(result: { error: { message: string } | null } = { error: null }) {
  const builder: any = result;
  builder.update = jest.fn(() => builder);
  builder.delete = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ error: result.error }).then(resolve);
  return builder;
}

describe('ClassRepository enrollment cleanup', () => {
  it('uses a valid enrollment status when deleting a class', async () => {
    const enrollmentQuery = query();
    const timetableQuery = query();
    const classQuery = query();
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'enrollments') return enrollmentQuery;
        if (table === 'timetable_slots') return timetableQuery;
        return classQuery;
      }),
    } as any;

    await new ClassRepository(supabase).delete('class-1');

    expect(enrollmentQuery.update).toHaveBeenCalledWith({ status: 'dropped' });
    expect(enrollmentQuery.update).not.toHaveBeenCalledWith({ status: 'cancelled' });
    expect(enrollmentQuery.eq).toHaveBeenCalledWith('status', 'enrolled');
  });

  it('does not delete the class when enrollment cleanup fails', async () => {
    const enrollmentQuery = query({ error: { message: 'database unavailable' } });
    const timetableQuery = query();
    const classQuery = query();
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === 'enrollments') return enrollmentQuery;
        if (table === 'timetable_slots') return timetableQuery;
        return classQuery;
      }),
    } as any;

    await expect(new ClassRepository(supabase).delete('class-1')).rejects.toThrow(
      'Failed to end class enrollments'
    );
    expect(classQuery.update).not.toHaveBeenCalled();
  });
});

describe('ClassRepository enrollment reads', () => {
  it('counts only active, non-deleted enrollments', async () => {
    const enrollmentQuery: Record<string, any> = { count: 2, error: null };
    for (const method of ['select', 'eq', 'is']) {
      enrollmentQuery[method] = jest.fn().mockReturnValue(enrollmentQuery);
    }
    const supabase = { from: jest.fn().mockReturnValue(enrollmentQuery) } as any;

    const count = await new ClassRepository(supabase).getEnrollmentCount('class-1');

    expect(count).toBe(2);
    expect(enrollmentQuery.eq).toHaveBeenCalledWith('class_id', 'class-1');
    expect(enrollmentQuery.eq).toHaveBeenCalledWith('status', 'enrolled');
    expect(enrollmentQuery.is).toHaveBeenCalledWith('deleted_at', null);
  });
});
