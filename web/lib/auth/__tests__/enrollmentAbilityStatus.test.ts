import { defineAbilitiesFor } from '../permissions/abilities';

describe('enrollment-scoped abilities', () => {
  it.each([
    ['teacher', 'Student'],
    ['student', 'Class'],
  ] as const)('uses the current enrollment status for %s %s access', (role, subject) => {
    const rules = defineAbilitiesFor({
      userId: `${role}-1`,
      role,
      classIds: ['class-1'],
    });
    const rule = rules.find((candidate) => candidate.subject === subject);

    expect(rule?.conditions).toEqual(
      expect.objectContaining({
        enrollments: expect.objectContaining({ status: 'enrolled' }),
      })
    );
  });
});
