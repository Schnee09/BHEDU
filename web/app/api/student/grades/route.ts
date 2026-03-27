import { apiPaginated, createGetHandler } from '@/lib/api';
import { gradeService } from '@/lib/services';
import { GradeRepository } from '@/lib/repositories/GradeRepository';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Student Grades API
 * GET /api/student/grades
 *
 * Returns personal grade records for the authenticated student
 */
export const GET = createGetHandler(
  { allowedRoles: ['student'] },
  async ({ user, searchParams }) => {
    const supabase = createServiceClient();
    const repo = new GradeRepository(supabase);

    const filters = {
      student_id: user.id,
      page: Number(searchParams.get('page')) || 1,
      pageSize: Number(searchParams.get('pageSize')) || Number(searchParams.get('limit')) || 50,
      subject_id: searchParams.get('subjectId') || undefined,
      semester: searchParams.get('semester') || undefined,
    };

    const { data: grades, total, page, pageSize } = await repo.findAll(filters);

    return apiPaginated(grades, {
      page,
      pageSize,
      total,
    });
  }
);
