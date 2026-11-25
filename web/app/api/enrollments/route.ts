import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { bulkEnrollmentSchema, createEnrollmentSchema, enrollmentQuerySchema } from '@/lib/schemas';
import { logger } from '@/lib/logger';
import { AuthorizationError, ValidationError } from '@/lib/api/errors';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { getDataClient } from '@/lib/auth/dataClient';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass } from '@/lib/auth/classAccess';

// GET /api/enrollments
export const GET = createGetHandler(
  { permission: 'enrollments.view' },
  async ({ searchParams, request, user }) => {
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    // Validate and normalize query params
    const query = enrollmentQuerySchema.safeParse({
      class_id: searchParams.get('classId') || searchParams.get('class_id') || undefined,
      student_id: searchParams.get('studentId') || searchParams.get('student_id') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || searchParams.get('pageSize') || undefined,
    });

    if (!query.success) {
      throw new ValidationError(query.error.issues[0]?.message || 'Tham số ghi danh không hợp lệ');
    }
    const validatedQuery = query.data;
    const scopedFilters: typeof validatedQuery & { class_ids?: string[]; student_ids?: string[] } =
      {
        ...validatedQuery,
        status: validatedQuery.status === 'all' ? undefined : validatedQuery.status,
      };

    if (!['admin', 'owner', 'super_admin', 'student', 'parent'].includes(user.role)) {
      if (validatedQuery.class_id) {
        if (!(await canAccessClass(supabase, user, validatedQuery.class_id))) {
          throw new AuthorizationError('Bạn không có quyền xem đăng ký của lớp này.');
        }
      } else {
        const { data: assignedClasses, error: assignedClassesError } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', user.id);
        if (assignedClassesError) {
          throw new Error(`Failed to verify assigned classes: ${assignedClassesError.message}`);
        }
        scopedFilters.class_ids = (assignedClasses || []).map((item) => item.id);
        if (scopedFilters.class_ids.length === 0) {
          return apiSuccess({ data: [], total: 0, page: validatedQuery.page, pageSize: 50 });
        }
      }
    } else if (user.role === 'student') {
      scopedFilters.student_id = user.id;
    } else if (user.role === 'parent') {
      const { data: links, error: linksError } = await supabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_id', user.id)
        .eq('status', 'approved');
      if (linksError) {
        throw new Error(`Failed to verify linked students: ${linksError.message}`);
      }
      const linkedStudentIds = (links || []).map((link) => link.student_id);
      if (validatedQuery.student_id) {
        if (!linkedStudentIds.includes(validatedQuery.student_id)) {
          throw new AuthorizationError('Bạn không có quyền xem đăng ký của học sinh này.');
        }
      } else {
        scopedFilters.student_ids = linkedStudentIds;
        if (scopedFilters.student_ids.length === 0) {
          return apiSuccess({ data: [], total: 0, page: validatedQuery.page, pageSize: 50 });
        }
      }
    } else if (!['admin', 'owner', 'super_admin'].includes(user.role)) {
      throw new AuthorizationError('Bạn không có quyền xem danh sách đăng ký lớp.');
    }

    const result = await repository.findAll(scopedFilters);
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
    if (!(await canAccessClass(supabase, user, targetClassId))) {
      throw new AuthorizationError('Bạn không có quyền ghi danh học sinh vào lớp này.');
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
