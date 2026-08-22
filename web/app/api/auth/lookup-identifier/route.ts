import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

const lookupSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập tên đăng nhập, mã định danh hoặc email'),
});

export const POST = createApiHandler(
  {
    requireAuth: false,
    bodySchema: lookupSchema,
  },
  async ({ body }) => {
    const raw = body.identifier.trim();
    const supabase = createServiceClient();

    // 1. If it's already an email format and contains @, check directly
    if (raw.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active')
        .or(`email.eq.${raw.toLowerCase()},personal_email.eq.${raw.toLowerCase()}`)
        .maybeSingle();

      if (data) {
        return apiSuccess({ email: data.email, role: data.role });
      }
      // If not in profiles, return the typed email directly as fallback
      return apiSuccess({ email: raw });
    }

    // 2. Check by student_code, teacher_code, student_id, phone, or email slug prefix
    const upper = raw.toUpperCase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .or(
        `student_code.ilike.${upper},teacher_code.ilike.${upper},student_id.ilike.${raw},phone.eq.${raw},email.ilike.${raw.toLowerCase()}@%`
      )
      .maybeSingle();

    if (profile && profile.email) {
      return apiSuccess({ email: profile.email, role: profile.role });
    }

    // 3. If it looks like a student code (e.g. HS...), fallback to student domain
    if (upper.startsWith('HS')) {
      return apiSuccess({ email: `${upper.toLowerCase()}@student.bhedu.vn` });
    }

    // Default fallback: return as @bhedu.vn or original
    return apiSuccess({ email: `${raw.toLowerCase()}@bhedu.vn` });
  }
);
