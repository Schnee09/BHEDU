import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { ValidationError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const lifecycleActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('end'),
    end_date: z.string().date(),
    status: z.enum(['completed', 'dropped', 'withdrawn']),
    reason: z.string().trim().min(3).max(500),
  }),
  z.object({
    action: z.literal('transfer'),
    to_class_id: z.string().uuid(),
    effective_date: z.string().date(),
    reason: z.string().trim().min(3).max(500),
  }),
]);

export const PATCH = createApiHandler(
  {
    permission: 'enrollments.manage',
    bodySchema: lifecycleActionSchema,
  },
  async ({ params, body, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
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
    return apiSuccess({ enrollment: Array.isArray(rpc.data) ? rpc.data[0] : rpc.data });
  }
);

// DELETE /api/enrollments/[id]
export const DELETE = createApiHandler(
  {
    permission: 'enrollments.manage',
  },
  async ({ params, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    const { error } = await supabase.rpc('end_enrollment_atomic', {
      p_enrollment_id: id,
      p_end_date: new Date().toISOString().split('T')[0],
      p_status: 'withdrawn',
      p_reason: 'Ended through legacy enrollment endpoint',
      p_actor_id: user.id,
    });

    if (error) throw new ValidationError(error.message);
    return apiSuccess({ success: true, message: 'Enrollment ended' });
  }
);
