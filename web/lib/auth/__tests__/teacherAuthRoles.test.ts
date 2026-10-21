import { canUseTeacherRoutes } from '@/lib/auth/adminAuth';

describe('canUseTeacherRoutes', () => {
  it.each(['teacher', 'admin', 'owner', 'super_admin'])('allows the privileged role %s', (role) => {
    expect(canUseTeacherRoutes(role)).toBe(true);
  });

  it.each(['student', 'parent', 'tutor', 'staff', '', 'unknown'])(
    'rejects the non-teacher role %s',
    (role) => {
      expect(canUseTeacherRoutes(role)).toBe(false);
    }
  );
});
