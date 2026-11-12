import { ClassRepository } from '../ClassRepository';

function query() {
  const builder: any = { error: null };
  builder.update = jest.fn(() => builder);
  builder.delete = jest.fn(() => builder);
  builder.eq = jest.fn(() => builder);
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ error: null }).then(resolve);
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
  });
});
