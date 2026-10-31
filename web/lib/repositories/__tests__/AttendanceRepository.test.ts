import { AttendanceRepository } from '../AttendanceRepository';

describe('AttendanceRepository write mapping', () => {
  const storedRecord = {
    id: 'attendance-1',
    student_id: '223e4567-e89b-12d3-a456-426614174000',
    class_id: '123e4567-e89b-12d3-a456-426614174000',
    date: '2026-10-31',
    status: 'present',
    remarks: 'Đến đúng giờ',
  };

  it('maps the API notes field to the database remarks column on create', async () => {
    const single = jest.fn().mockResolvedValue({ data: storedRecord, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    const supabase = { from: jest.fn(() => ({ insert })) } as any;
    const repository = new AttendanceRepository(supabase);

    await repository.create({
      student_id: storedRecord.student_id,
      class_id: storedRecord.class_id,
      date: storedRecord.date,
      status: 'present',
      notes: 'Đến đúng giờ',
      marked_by: 'teacher-1',
    });

    expect(insert).toHaveBeenCalledWith({
      student_id: storedRecord.student_id,
      class_id: storedRecord.class_id,
      date: storedRecord.date,
      status: 'present',
      remarks: 'Đến đúng giờ',
      marked_by: 'teacher-1',
    });
  });

  it('maps notes to remarks on update without clearing omitted remarks', async () => {
    const single = jest.fn().mockResolvedValue({ data: storedRecord, error: null });
    const select = jest.fn(() => ({ single }));
    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    const supabase = { from: jest.fn(() => ({ update })) } as any;
    const repository = new AttendanceRepository(supabase);

    await repository.update(storedRecord.id, { status: 'late' });
    expect(update).toHaveBeenLastCalledWith({ status: 'late' });

    await repository.update(storedRecord.id, { notes: 'Đến muộn 10 phút' });
    expect(update).toHaveBeenLastCalledWith({ remarks: 'Đến muộn 10 phút' });
  });
});
