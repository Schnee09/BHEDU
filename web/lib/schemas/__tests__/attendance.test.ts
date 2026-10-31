import { attendanceQuerySchema, bulkAttendanceSchema } from '../requests/attendance';

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
