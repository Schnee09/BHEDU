import { z } from 'zod';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { getDataClient } from '@/lib/auth/dataClient';
import { createEnrollmentSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';

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
  async ({ searchParams, request }) => {
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    const params = {
      student_id: searchParams.get('student_id') || undefined,
      class_id: searchParams.get('class_id') || undefined,
      status: searchParams.get('status') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const validated = listSchema.parse(params);
    const result = await repository.findAll(validated);

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
