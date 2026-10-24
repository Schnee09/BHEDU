import { z } from 'zod';
import { apiSuccess, createApiHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { findStudentDuplicates } from '@/lib/students/duplicateCheck';

const optionalLookupValue = z.string().trim().max(200).optional().nullable();

export const studentDuplicateCheckSchema = z.object({
  full_name: optionalLookupValue,
  student_code: optionalLookupValue,
  student_id: optionalLookupValue,
  phone: optionalLookupValue,
  personal_email: optionalLookupValue,
  email: optionalLookupValue,
});

export const POST = createApiHandler(
  {
    permission: 'students.create',
    bodySchema: studentDuplicateCheckSchema,
  },
  async ({ body }) => {
    const matches = await findStudentDuplicates(createServiceClient(), body);
    return apiSuccess({
      matches,
      requires_confirmation: matches.some((match) => match.severity !== 'low'),
    });
  }
);
