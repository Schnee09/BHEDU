import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { AuthorizationError, NotFoundError, ValidationError } from '@/lib/api/errors';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { enrollmentLifecycleActionSchema } from '@/lib/schemas';
import { getDataClient } from '@/lib/auth/dataClient';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass, canAccessStudent } from '@/lib/auth/classAccess';

// GET /api/admin/enrollments/[id]
export const GET = createGetHandler(
  {
    permission: 'enrollments.view',
  },
  async ({ params, request, user }) => {
    const id = params.id as string;
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    const enrollment = await repository.findById(id);
    if (!enrollment) {
      throw new NotFoundError('Không tìm thấy đăng ký lớp.');
    }
    const canViewEnrollment =
      (await canAccessClass(supabase, user, enrollment.class_id)) ||
      (await canAccessStudent(supabase, user, enrollment.student_id));
    if (!canViewEnrollment) {
      throw new AuthorizationError('Bạn không có quyền xem đăng ký lớp này.');
    }

    return apiSuccess({ enrollment });
  }
);

// PATCH /api/admin/enrollments/[id]
export const PATCH = createApiHandler(
  {
    permission: 'enrollments.manage',
    bodySchema: enrollmentLifecycleActionSchema,
  },
  async ({ params, body, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    const { data: existing, error: existingError } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();
    if (existingError || !existing) {
      throw new NotFoundError('Không tìm thấy đăng ký lớp.');
    }
    if (!(await canAccessClass(supabase, user, existing.class_id))) {
      throw new AuthorizationError('Bạn không có quyền thay đổi đăng ký của lớp này.');
    }
    if (body.action === 'transfer' && !(await canAccessClass(supabase, user, body.to_class_id))) {
      throw new AuthorizationError('Bạn không có quyền chuyển học sinh vào lớp đích.');
    }

    const rpc =
      body.action === 'transfer'
        ? await supabase.rpc('transfer_student_atomic', {
            p_enrollment_id: id,
            p_to_class_id: body.to_class_id,
            p_effective_date: body.effective_date,
            p_reason: body.reason,
            p_actor_id: user.id,
          })
        : await supabase.rpc('end_enrollment_atomic', {
            p_enrollment_id: id,
            p_end_date: body.end_date,
            p_status: body.status,
            p_reason: body.reason,
            p_actor_id: user.id,
          });

    if (rpc.error) throw new ValidationError(rpc.error.message);
    const enrollment = Array.isArray(rpc.data) ? rpc.data[0] : rpc.data;
    return apiSuccess({ enrollment });
  }
);
