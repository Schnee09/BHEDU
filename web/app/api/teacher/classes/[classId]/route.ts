import { apiSuccess, createGetHandler } from '@/lib/api';
import { classService } from '@/lib/services';
import { ForbiddenError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

/**
 * Teacher Class Detail API
 * GET /api/teacher/classes/[classId]
 *
 * Returns detailed information and statistics for a specific class
 */
export const GET = createGetHandler({ allowedRoles: ['teacher'] }, async ({ params, user }) => {
  const { classId } = params as { classId: string };

  const classData = await classService.getClassById(classId);

  // Verify teacher ownership
  if (classData.teacher_id !== user.id) {
    throw new ForbiddenError('You are not assigned to this class');
  }

  const stats = await classService.getClassGradeStats(classId);

  return apiSuccess({
    ...classData,
    stats,
  });
});
