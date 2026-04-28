import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { getDataClient } from '@/lib/auth/dataClient';

// DELETE /api/enrollments/[id]
export const DELETE = createApiHandler(
  {
    permission: 'enrollments.manage',
  },
  async ({ params, request }) => {
    const id = params.id as string;
    const { supabase } = await getDataClient(request);
    const repository = new EnrollmentRepository(supabase);

    await repository.delete(id);

    return apiSuccess({ success: true, message: 'Enrollment deleted' });
  }
);
