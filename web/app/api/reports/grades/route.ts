import { apiSuccess, createGetHandler } from '@/lib/api';
import { classService } from '@/lib/services';
import { NotFoundError } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

/**
 * Grade Report API
 * GET /api/reports/grades
 *
 * Returns aggregate grade statistics for a specific class
 */
export const GET = createGetHandler(
  { allowedRoles: ['admin', 'teacher'] },
  async ({ searchParams }) => {
    const classId = searchParams.get('classId');

    if (!classId) {
      throw new NotFoundError('classId is required');
    }

    const [classDetails, gradeStats] = await Promise.all([
      classService.getClassById(classId),
      classService.getClassGradeStats(classId),
    ]);

    return apiSuccess({
      classDetails: {
        id: classDetails.id,
        name: classDetails.name,
      },
      ...gradeStats,
    });
  }
);
