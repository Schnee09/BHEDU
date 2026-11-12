import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { bulkEnrollmentSchema, createEnrollmentSchema, enrollmentQuerySchema } from '@/lib/schemas';
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

    if (!query.success) {
      throw new ValidationError(query.error.issues[0]?.message || 'Tham số ghi danh không hợp lệ');
    }
    const validatedQuery = query.data;

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
      const parsed = bulkEnrollmentSchema.safeParse({
        class_id: targetClassId,
        student_ids: targetStudentIds,
        enrollment_date: enrollmentDate,
        notes: payload.notes,
      });
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues[0]?.message || 'Dữ liệu ghi danh không hợp lệ'
        );
      }
      const { data, error } = await supabase.rpc('enroll_students_batch_atomic', {
        p_student_ids: parsed.data.student_ids,
        p_class_id: parsed.data.class_id,
        p_enrollment_date: parsed.data.enrollment_date || enrollmentDate,
        p_notes: parsed.data.notes || null,
        p_actor_id: user.id,
      });

      if (error) throw new ValidationError(error.message);
      const successCount = Array.isArray(data) ? data.length : targetStudentIds.length;

      logger.info('Bulk enrollment completed', {
        classId: targetClassId,
        successCount,
        failedCount: 0,
      });

      return apiSuccess({
        message: `Đã ghi danh ${successCount} học sinh`,
        enrolledCount: successCount,
        failedCount: 0,
        enrollments: data || [],
      });
    }

    // Single enrollment
    const targetStudentId = studentId || student_id;
    if (!targetStudentId) {
      throw new ValidationError('Mã học sinh là bắt buộc');
    }
    const parsed = createEnrollmentSchema.safeParse({
      student_id: targetStudentId,
      class_id: targetClassId,
      enrollment_date: enrollmentDate,
      notes: payload.notes,
    });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || 'Dữ liệu ghi danh không hợp lệ');
    }

    const { data, error } = await supabase.rpc('enroll_student_atomic', {
      p_student_id: parsed.data.student_id,
      p_class_id: parsed.data.class_id,
      p_enrollment_date: parsed.data.enrollment_date || enrollmentDate,
      p_notes: parsed.data.notes || null,
      p_source_system: null,
      p_source_key: null,
      p_actor_id: user.id,
    });

    if (error) throw new ValidationError(error.message);
    const enrollment = Array.isArray(data) ? data[0] : data;

    return apiSuccess({ enrollment });
  }
);
