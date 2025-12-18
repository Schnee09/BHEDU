import { routes } from '@/lib/routes';

describe('routes smoke', () => {
  it('generates a handful of canonical routes', () => {
    // Basic expectations: these helpers should return strings and include expected path segments
    const students = routes.students.list();
  const adminStudents = routes.admin.students.list();
    const gradesList = routes.grades.list();

    expect(typeof students).toBe('string');
    expect(students).toContain('/students');

    expect(typeof adminStudents).toBe('string');
    expect(adminStudents).toContain('/admin');

    expect(typeof gradesList).toBe('string');
    expect(gradesList).toContain('/grades');
  });
});
