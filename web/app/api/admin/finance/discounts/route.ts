import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { studentTuitionDiscountSchema } from '@/lib/schemas';
import { createServiceClient } from '@/lib/supabase/server';

export const GET = createGetHandler({ permission: 'finance.view' }, async ({ searchParams }) => {
  const academicYearId = searchParams.get('academic_year_id');
  const classId = searchParams.get('class_id');
  const studentId = searchParams.get('student_id');

  if (!academicYearId) {
    throw new ValidationError('academic_year_id is required');
  }

  let query = createServiceClient()
    .from('student_tuition_discounts')
    .select('*, student:profiles!student_id(id, full_name, student_code), class:classes(id, name)')
    .eq('academic_year_id', academicYearId)
    .order('effective_from', { ascending: false });

  if (classId) query = query.eq('class_id', classId);
  if (studentId) query = query.eq('student_id', studentId);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch tuition discounts: ${error.message}`);

  return apiSuccess(data || []);
});

export const POST = createApiHandler(
  { permission: 'finance.manage', bodySchema: studentTuitionDiscountSchema },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', body.student_id)
      .eq('class_id', body.class_id)
      .eq('status', 'enrolled')
      .maybeSingle();

    if (enrollmentError) {
      throw new Error(`Failed to verify enrollment: ${enrollmentError.message}`);
    }
    if (!enrollment) {
      throw new ValidationError('Student is not actively enrolled in this class');
    }

    const { data, error } = await supabase
      .from('student_tuition_discounts')
      .upsert(
        { ...body, created_by: user.id },
        { onConflict: 'student_id,class_id,academic_year_id,effective_from' }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to save tuition discount: ${error.message}`);
    return apiSuccess(data, { _status: 201 });
  }
);
