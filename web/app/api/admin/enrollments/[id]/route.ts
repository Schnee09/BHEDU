import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api/apiHandler';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';
import { getDataClient } from '@/lib/auth/dataClient';

// GET /api/admin/enrollments/[id]
export const GET = createGetHandler({
  permission: 'enrollments.view',
}, async ({ params, request }) => {
  const id = params.id as string;
  const { supabase } = await getDataClient(request);
  const repository = new EnrollmentRepository(supabase);
  
  const enrollment = await repository.findById(id);
  return apiSuccess({ enrollment });
});

// PATCH /api/admin/enrollments/[id]
export const PATCH = createApiHandler({
  permission: 'enrollments.manage',
}, async ({ params, body, request }) => {
  const id = params.id as string;
  const { supabase } = await getDataClient(request);
  const repository = new EnrollmentRepository(supabase);
  
  const enrollment = await repository.update(id, body as any);
  return apiSuccess({ enrollment });
});

// DELETE /api/admin/enrollments/[id]
export const DELETE = createApiHandler({
  permission: 'enrollments.manage',
}, async ({ params, request }) => {
  const id = params.id as string;
  const { supabase } = await getDataClient(request);
  const repository = new EnrollmentRepository(supabase);
  
  await repository.delete(id);
  return apiSuccess({ success: true });
});
