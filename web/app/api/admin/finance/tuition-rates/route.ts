import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { tuitionRateSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler({ permission: 'finance.view' }, async ({ searchParams }) => {
  const academicYearId = searchParams.get('academic_year_id');
  const classId = searchParams.get('class_id');

  if (!academicYearId) {
    throw new ValidationError('academic_year_id is required');
  }

  let query = createServiceClient()
    .from('class_tuition_rates')
    .select('*, class:classes(id, name)')
    .eq('academic_year_id', academicYearId)
    .order('effective_from', { ascending: false });

  if (classId) query = query.eq('class_id', classId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch tuition rates: ${error.message}`);

  return apiSuccess(data || []);
});

export const POST = createApiHandler(
  { permission: 'finance.manage', bodySchema: tuitionRateSchema },
  async ({ body, user }) => {
    const { data, error } = await createServiceClient()
      .from('class_tuition_rates')
      .upsert(
        { ...body, created_by: user.id },
        { onConflict: 'class_id,academic_year_id,effective_from' }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to save tuition rate: ${error.message}`);
    return apiSuccess(data, { _status: 201 });
  }
);
