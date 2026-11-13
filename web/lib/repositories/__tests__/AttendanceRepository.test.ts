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

  it('uses the atomic daily attendance RPC on create', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [storedRecord], error: null });
    const repository = new AttendanceRepository({ rpc } as any);

    await repository.create({
      student_id: storedRecord.student_id,
      class_id: storedRecord.class_id,
      date: storedRecord.date,
      status: 'present',
      notes: 'Đến đúng giờ',
      marked_by: 'teacher-1',
    });

    expect(rpc).toHaveBeenCalledWith('upsert_daily_attendance_batch', {
      p_class_id: storedRecord.class_id,
      p_date: storedRecord.date,
      p_records: [
        {
          student_id: storedRecord.student_id,
          status: 'present',
          notes: 'Đến đúng giờ',
        },
      ],
      p_marked_by: 'teacher-1',
    });
  });

  it('fails create when the RPC returns no record', async () => {
    const repository = new AttendanceRepository({
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    } as any);

    await expect(
      repository.create({
        student_id: storedRecord.student_id,
        class_id: storedRecord.class_id,
        date: storedRecord.date,
        status: 'present',
        marked_by: 'teacher-1',
      })
    ).rejects.toThrow('no record returned');
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

  it('uses the atomic daily attendance RPC for bulk writes', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: [storedRecord], error: null });
    const repository = new AttendanceRepository({ rpc } as any);
    const records = [
      {
        student_id: storedRecord.student_id,
        status: 'present' as const,
        notes: 'Đến đúng giờ',
      },
    ];

    await repository.createBulk({
      class_id: storedRecord.class_id,
      date: storedRecord.date,
      records,
      marked_by: 'teacher-1',
    });

    expect(rpc).toHaveBeenCalledWith('upsert_daily_attendance_batch', {
      p_class_id: storedRecord.class_id,
      p_date: storedRecord.date,
      p_records: records,
      p_marked_by: 'teacher-1',
    });
  });

  it('summarizes the complete filtered attendance scope', async () => {
    const result = {
      data: [{ status: 'present' }, { status: 'late' }, { status: 'absent' }],
      error: null,
    };
    const query: Record<string, any> = { ...result };
    for (const method of ['select', 'is', 'eq', 'in', 'gte', 'lte']) {
      query[method] = jest.fn().mockReturnValue(query);
    }
    const repository = new AttendanceRepository({
      from: jest.fn().mockReturnValue(query),
    } as any);

    const summary = await repository.getSummary({
      student_id: storedRecord.student_id,
      from_date: '2026-10-01',
      to_date: '2026-10-31',
    });

    expect(query.is).toHaveBeenCalledWith('deleted_at', null);
    expect(query.eq).toHaveBeenCalledWith('student_id', storedRecord.student_id);
    expect(query.gte).toHaveBeenCalledWith('date', '2026-10-01');
    expect(query.lte).toHaveBeenCalledWith('date', '2026-10-31');
    expect(summary).toMatchObject({ total: 3, present: 1, late: 1, attendanceRate: 67 });
  });
});
