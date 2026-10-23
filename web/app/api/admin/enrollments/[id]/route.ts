import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { getDataClient } from '@/lib/auth/dataClient';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/admin/enrollments/[id]
export const GET = createGetHandler(
  {
    permission: 'enrollments.view',
  },
  async ({ params, request }) => {
    const id = params.id as string;
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    const enrollment = await repository.findById(id);
    return apiSuccess({ enrollment });
  }
);

// PATCH /api/admin/enrollments/[id]
export const PATCH = createApiHandler(
  {
    permission: 'enrollments.manage',
  },
  async ({ params, body, request }) => {
    const id = params.id as string;
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    const enrollment = await repository.update(id, body as any);
    return apiSuccess({ enrollment });
  }
);

// DELETE /api/admin/enrollments/[id]
export const DELETE = createApiHandler(
  {
    permission: 'enrollments.manage',
  },
  async ({ params, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('end_enrollment_atomic', {
      p_enrollment_id: id,
      p_end_date: new Date().toISOString().split('T')[0],
      p_status: 'withdrawn',
      p_reason: 'Ended from enrollment administration',
      p_actor_id: user.id,
    });

    if (error) throw new Error(`Failed to end enrollment: ${error.message}`);
    return apiSuccess({ enrollment: Array.isArray(data) ? data[0] : data });
  }
);
