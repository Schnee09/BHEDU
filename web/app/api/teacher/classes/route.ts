import { apiSuccess, createGetHandler } from '@/lib/api';
import { classService } from '@/lib/services';

export const dynamic = 'force-dynamic';

/**
 * Teacher Classes API
 * GET /api/teacher/classes
 *
 * Returns a list of classes taught by the authenticated teacher
 */
export const GET = createGetHandler({ allowedRoles: ['teacher'] }, async ({ user }) => {
  // Standardize filters for classService
  const filters = {
    teacherId: user.id,
    status: 'active' as const,
  };

  const { classes } = await classService.getClasses(filters);

  return apiSuccess(classes);
});
