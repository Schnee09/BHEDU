import {
  attendanceQuerySchema,
  bulkAttendanceSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} from '../requests/attendance';

const ids = {
  class_id: '11111111-1111-4111-8111-111111111111',
  student_id: '22222222-2222-4222-8222-222222222222',
};

describe('bulk attendance schema', () => {
  it('accepts a regular attendance record', () => {
    expect(
      bulkAttendanceSchema.safeParse({
        class_id: ids.class_id,
        date: '2026-10-28',
        records: [{ student_id: ids.student_id, status: 'present' }],
      }).success
    ).toBe(true);
  });

  it('accepts an auditable enrollment exception reason', () => {
    expect(
      bulkAttendanceSchema.safeParse({
        class_id: ids.class_id,
        date: '2026-10-28',
        records: [
          {
            student_id: ids.student_id,
            status: 'present',
            enrollment_exception_reason: 'Học thử theo lịch hẹn',
          },
        ],
      }).success
    ).toBe(true);
  });

  it('rejects duplicate students and invalid exception reasons', () => {
    const record = { student_id: ids.student_id, status: 'present' as const };
    expect(
      bulkAttendanceSchema.safeParse({
        class_id: ids.class_id,
        date: '2026-10-28',
        records: [record, record],
      }).success
    ).toBe(false);
    expect(
      bulkAttendanceSchema.safeParse({
        class_id: ids.class_id,
        date: '2026-10-28',
        records: [{ ...record, enrollment_exception_reason: '  ' }],
      }).success
    ).toBe(false);
  });

  it('rejects client-supplied audit attribution', () => {
    expect(
      bulkAttendanceSchema.safeParse({
        class_id: ids.class_id,
        date: '2026-10-28',
        marked_by: '33333333-3333-4333-8333-333333333333',
        records: [{ student_id: ids.student_id, status: 'present' }],
      }).success
    ).toBe(false);
  });
});

describe('attendance query schema', () => {
  it('treats the all status option as no status filter', () => {
    expect(attendanceQuerySchema.parse({ status: 'all' }).status).toBeUndefined();
  });
});

describe('single attendance schema', () => {
  const record = {
    class_id: ids.class_id,
    student_id: ids.student_id,
    date: '2026-10-31',
    status: 'present',
  };

  it('accepts a supported note', () => {
    expect(createAttendanceSchema.safeParse({ ...record, notes: 'Đến đúng giờ' }).success).toBe(
      true
    );
  });

  it('rejects retired storage fields and client audit attribution', () => {
    expect(createAttendanceSchema.safeParse({ ...record, check_in_time: '18:00' }).success).toBe(
      false
    );
    expect(createAttendanceSchema.safeParse({ ...record, marked_by: ids.student_id }).success).toBe(
      false
    );
  });

  it('allows supported partial updates and rejects retired time fields', () => {
    expect(updateAttendanceSchema.safeParse({ status: 'late', notes: 'Đến muộn' }).success).toBe(
      true
    );
    expect(updateAttendanceSchema.safeParse({ check_out_time: '20:00' }).success).toBe(false);
    expect(updateAttendanceSchema.safeParse({}).success).toBe(false);
  });
});
