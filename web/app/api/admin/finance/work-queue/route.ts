import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler({ permission: 'finance.view' }, async ({ searchParams }) => {
  const academicYearId = searchParams.get('academic_year_id') || null;
  const { data, error } = await createServiceClient().rpc('finance_work_queue_summary', {
    p_academic_year_id: academicYearId,
  });
  if (error) throw error;
  return apiSuccess(data);
});
