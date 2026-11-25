import { z } from 'zod';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { getDataClient } from '@/lib/auth/dataClient';
import { createEnrollmentSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass } from '@/lib/auth/classAccess';
import { AuthorizationError } from '@/lib/api/errors';

const listSchema = z.object({
  student_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  status: z
    .enum(['enrolled', 'withdrawn', 'completed', 'dropped', 'transferred', 'all'])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

// GET /api/admin/enrollments
export const GET = createGetHandler(
  { permission: 'enrollments.view' },
  async ({ searchParams, request, user }) => {
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    const params = {
      student_id: searchParams.get('student_id') || undefined,
      class_id: searchParams.get('class_id') || undefined,
      status: searchParams.get('status') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const validated = listSchema.parse(params);
    const scopedFilters: typeof validated & { class_ids?: string[]; student_ids?: string[] } = {
      ...validated,
      status: validated.status === 'all' ? undefined : validated.status,
    };

    if (!['admin', 'owner', 'super_admin', 'student', 'parent'].includes(user.role)) {
      if (validated.class_id) {
        if (!(await canAccessClass(supabase, user, validated.class_id))) {
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
          return apiSuccess({
            data: [],
            total: 0,
            page: validated.page,
            pageSize: validated.limit,
          });
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
      if (validated.student_id) {
        if (!linkedStudentIds.includes(validated.student_id)) {
          throw new AuthorizationError('Bạn không có quyền xem đăng ký của học sinh này.');
        }
      } else {
        scopedFilters.student_ids = linkedStudentIds;
        if (scopedFilters.student_ids.length === 0) {
          return apiSuccess({
            data: [],
            total: 0,
            page: validated.page,
            pageSize: validated.limit,
          });
        }
      }
    } else if (!['admin', 'owner', 'super_admin'].includes(user.role)) {
      throw new AuthorizationError('Bạn không có quyền xem danh sách đăng ký lớp.');
    }

    const result = await repository.findAll(scopedFilters);

    return apiSuccess(result);
  }
);

// POST /api/admin/enrollments
export const POST = createApiHandler(
  {
    permission: 'enrollments.manage',
    bodySchema: createEnrollmentSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    if (!(await canAccessClass(supabase, user, body.class_id))) {
      throw new AuthorizationError('Bạn không có quyền đăng ký học sinh vào lớp này.');
    }

    const { data, error } = await supabase.rpc('enroll_student_atomic', {
      p_student_id: body.student_id,
      p_class_id: body.class_id,
      p_enrollment_date: body.enrollment_date || new Date().toISOString().slice(0, 10),
      p_notes: body.notes || null,
      p_source_system: null,
      p_source_key: null,
      p_actor_id: user.id,
    });

    if (error) throw new Error(`Failed to create enrollment: ${error.message}`);
    const enrollment = Array.isArray(data) ? data[0] : data;
    return apiSuccess({ enrollment });
  }
);
