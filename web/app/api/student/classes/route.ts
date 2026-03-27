import { apiSuccess, createGetHandler } from '@/lib/api';
import { studentService } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * Student Classes API
 * GET /api/student/classes
 *
 * Returns a list of classes the authenticated student is currently enrolled in
 */
export const GET = createGetHandler({ allowedRoles: ['student'] }, async ({ user }) => {
  const studentWithClasses = await studentService.getStudentById(user.id);

  if (!studentWithClasses) {
    return apiSuccess([]);
  }

  // Flatten and return class details from enrollments
  const classes = studentWithClasses.enrollments
    .filter((e) => e.status === 'enrolled' || e.status === 'active')
    .map((e) => ({
      id: e.class_id,
      name: e.classes.name,
      enrollment_date: e.enrollment_date,
      status: e.status,
    }));

  return apiSuccess(classes);
});
