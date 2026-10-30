import { apiSuccess, createGetHandler } from '@/lib/api';
import { classService } from '@/lib/services';
import { NotFoundError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass } from '@/lib/auth/classAccess';

export const dynamic = 'force-dynamic';

/**
 * Grade Report API
 * GET /api/reports/grades
 *
 * Returns aggregate grade statistics for a specific class
 */
export const GET = createGetHandler({ requireAuth: true }, async ({ searchParams, user }) => {
  const classId = searchParams.get('classId');

  if (!classId) {
    throw new NotFoundError('classId is required');
  }

  const supabase = createServiceClient();
  if (!(await canAccessClass(supabase, { id: user.id, role: user.role }, classId))) {
    return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
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
});
