import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { enrollmentQuerySchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/lib/api/errors';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { getDataClient } from '@/lib/auth/dataClient';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/enrollments
export const GET = createGetHandler(
  { permission: 'enrollments.view' },
  async ({ searchParams, request }) => {
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    // Validate and normalize query params
    const query = enrollmentQuerySchema.safeParse({
      class_id: searchParams.get('classId') || searchParams.get('class_id'),
      student_id: searchParams.get('studentId') || searchParams.get('student_id'),
      status: searchParams.get('status'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit') || searchParams.get('pageSize'),
    });

    const validatedQuery = query.success
      ? query.data
      : {
          page: 1,
          limit: 50,
          status: 'enrolled' as const,
          sort: 'created_at',
          order: 'desc' as const,
        };

    const result = await repository.findAll(validatedQuery);
    return apiSuccess({
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  }
);

// POST /api/enrollments
export const POST = createApiHandler(
  {
    permission: 'enrollments.manage',
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    const payload = body as Record<string, any>;
    const enrollmentDate = payload.enrollment_date || new Date().toISOString().slice(0, 10);

    const { studentId, classId, studentIds, student_id, class_id, student_ids } = payload;

    const targetClassId = classId || class_id;
    if (!targetClassId) {
      throw new ValidationError('Mã lớp là bắt buộc');
    }

    // Bulk enrollment
    const targetStudentIds = studentIds || student_ids;
    if (targetStudentIds && Array.isArray(targetStudentIds)) {
      const results = await Promise.allSettled(
        targetStudentIds.map((targetStudentId: string) =>
          supabase.rpc('enroll_student_atomic', {
            p_student_id: targetStudentId,
            p_class_id: targetClassId,
            p_enrollment_date: enrollmentDate,
            p_notes: payload.notes || null,
            p_source_system: null,
            p_source_key: null,
            p_actor_id: user.id,
          })
        )
      );

      const successCount = results.filter(
        (result) => result.status === 'fulfilled' && !result.value.error
      ).length;
      const failedCount = results.length - successCount;

      logger.info('Bulk enrollment completed', {
        classId: targetClassId,
        successCount,
        failedCount,
      });

      return apiSuccess({
        message: `Đã ghi danh ${successCount} học sinh, ${failedCount} thất bại`,
        enrolledCount: successCount,
        failedCount: failedCount,
        results: results.map((result, index) => ({
          student_id: targetStudentIds[index],
          success: result.status === 'fulfilled' && !result.value.error,
          error: result.status === 'rejected' ? String(result.reason) : result.value.error?.message,
        })),
      });
    }

    // Single enrollment
    const targetStudentId = studentId || student_id;
    if (!targetStudentId) {
      throw new ValidationError('Mã học sinh là bắt buộc');
    }

    const { data, error } = await supabase.rpc('enroll_student_atomic', {
      p_student_id: targetStudentId,
      p_class_id: targetClassId,
      p_enrollment_date: enrollmentDate,
      p_notes: payload.notes || null,
      p_source_system: null,
      p_source_key: null,
      p_actor_id: user.id,
    });

    if (error) throw new ValidationError(error.message);
    const enrollment = Array.isArray(data) ? data[0] : data;

    return apiSuccess({ enrollment });
  }
);
