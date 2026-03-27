import { apiSuccess, createGetHandler } from '@/lib/api';
import { classService } from '@/lib/services';
import { ForbiddenError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

/**
 * Teacher Class Students API
 * GET /api/teacher/classes/[classId]/students
 *
 * Returns a list of students enrolled in a specific class
 */
export const GET = createGetHandler({ allowedRoles: ['teacher'] }, async ({ params, user }) => {
  const { classId } = params as { classId: string };

  // Verify teacher ownership first
  const classData = await classService.getClassById(classId);
  if (classData.teacher_id !== user.id) {
    throw new ForbiddenError('You are not assigned to this class');
  }

  const students = await classService.getClassStudents(classId);

  return apiSuccess(students);
});
