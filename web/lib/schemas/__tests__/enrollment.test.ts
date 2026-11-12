import {
  bulkEnrollmentSchema,
  createEnrollmentSchema,
  enrollmentLifecycleActionSchema,
} from '../requests/enrollment';

describe('enrollment creation schemas', () => {
  const studentId = '11111111-1111-4111-8111-111111111111';
  const classId = '22222222-2222-4222-8222-222222222222';

  it('defaults a valid single enrollment to enrolled', () => {
    const result = createEnrollmentSchema.parse({ student_id: studentId, class_id: classId });
    expect(result.status).toBe('enrolled');
  });

  it('rejects invalid identifiers and oversized bulk requests', () => {
    expect(
      createEnrollmentSchema.safeParse({ student_id: 'invalid', class_id: classId }).success
    ).toBe(false);
    expect(
      bulkEnrollmentSchema.safeParse({
        class_id: classId,
        student_ids: Array.from({ length: 101 }, () => studentId),
      }).success
    ).toBe(false);
  });
});

describe('enrollment lifecycle action schema', () => {
  it('accepts an explicit end command with an auditable reason', () => {
    expect(
      enrollmentLifecycleActionSchema.safeParse({
        action: 'end',
        end_date: '2026-10-27',
        status: 'withdrawn',
        reason: 'Phụ huynh xác nhận nghỉ học',
      }).success
    ).toBe(true);
  });

  it('rejects direct status updates and missing reasons', () => {
    expect(enrollmentLifecycleActionSchema.safeParse({ status: 'withdrawn' }).success).toBe(false);
    expect(
      enrollmentLifecycleActionSchema.safeParse({
        action: 'end',
        end_date: '2026-10-27',
        status: 'withdrawn',
        reason: '  ',
      }).success
    ).toBe(false);
  });

  it('requires a valid destination class for transfers', () => {
    expect(
      enrollmentLifecycleActionSchema.safeParse({
        action: 'transfer',
        to_class_id: '22222222-2222-4222-8222-222222222222',
        effective_date: '2026-10-28',
        reason: 'Chuyển sang lớp phù hợp lịch học',
      }).success
    ).toBe(true);
    expect(
      enrollmentLifecycleActionSchema.safeParse({
        action: 'transfer',
        to_class_id: 'invalid',
        effective_date: '2026-10-28',
        reason: 'Chuyển lớp',
      }).success
    ).toBe(false);
  });
});
