import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { success } from '@/lib/api/responses';
import { handleApiError } from '@/lib/api/errors';
import { uuidSchema } from '@/lib/api/schemas';
import { StudentService } from '@/lib/services/studentService';
import { withLogging } from '@/lib/api/logging';
import { createClientFromRequest } from '@/lib/supabase/server';

/**
 * GET /api/v1/students/[id]/grades
 * Get all grades for a student
 */
export const GET = withLogging(
  withAuth(async (
    _request: NextRequest,
    context: { params?: Promise<Record<string, string>>; userId: string; userEmail: string }
  ) => {
    try {
      const params = await context.params;
      const studentId = uuidSchema.parse(params?.id);

      // Enforce that students can only read their own grades.
      // Allow admins (checked via RPC) to read any student's grades.
      const supabase = createClientFromRequest(_request);
      const { data: isAdmin, error: adminCheckError } = await supabase.rpc('is_admin', {
        uid: context.userId,
      });

      if (adminCheckError) {
        return handleApiError(adminCheckError);
      }

      if (!isAdmin && context.userId !== studentId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'content-type': 'application/json' },
        });
      }

      const grades = await StudentService.getStudentGrades(studentId);

      return success(grades);
    } catch (error) {
      return handleApiError(error);
    }
  })
);
