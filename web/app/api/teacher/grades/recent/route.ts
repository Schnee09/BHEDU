import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/teacher/grades/recent
 * Returns the last 20 grades entered in classes taught by the logged-in teacher
 */
export const GET = createGetHandler({ allowedRoles: ['teacher'] }, async ({ user }) => {
  const supabase = createServiceClient();

  // 1. Get class IDs taught by this teacher
  const { data: teacherClasses, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', user.id);

  if (classError) {
    logger.error('Failed to query teacher classes for grades', classError);
    throw new Error('Failed to retrieve teacher classes');
  }

  if (!teacherClasses || teacherClasses.length === 0) {
    return apiSuccess([]);
  }

  const classIds = teacherClasses.map((c: any) => c.id);

  // 2. Fetch the latest 20 grades
  const { data: grades, error: gradeError } = await supabase
    .from('grades')
    .select(
      `
      id,
      score,
      points_earned,
      component_type,
      created_at,
      student:profiles(id, full_name),
      class:classes(id, name),
      subject:subjects(id, name, code)
    `
    )
    .in('class_id', classIds)
    .order('created_at', { ascending: false })
    .limit(20);

  if (gradeError) {
    logger.error('Failed to query recent grades for teacher', gradeError);
    throw new Error('Failed to retrieve recent grades');
  }

  return apiSuccess(grades || []);
});
