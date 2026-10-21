import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler } from '@/lib/api/apiHandler';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';

const lookupSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đăng nhập, mã định danh hoặc email')
    .max(200)
    .regex(/^[A-Za-z0-9@._+\-]+$/, 'Thông tin đăng nhập chứa ký tự không hợp lệ'),
});

export const POST = createApiHandler(
  {
    requireAuth: false,
    bodySchema: lookupSchema,
  },
  async ({ body, request }) => {
    const rateCheck = checkRateLimit(
      `identifier-lookup:${getRateLimitIdentifier(request)}`,
      rateLimitConfigs.authStrict
    );
    if (!rateCheck.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const raw = body.identifier.trim();
    const supabase = createServiceClient();

    // 1. If it's already an email format and contains @, check directly
    if (raw.includes('@')) {
      const { data } = await supabase
        .from('profiles')
        .select('email')
        .or(`email.eq.${raw.toLowerCase()},personal_email.eq.${raw.toLowerCase()}`)
        .maybeSingle();

      if (data) {
        return apiSuccess({ email: data.email });
      }
      // If not in profiles, return the typed email directly as fallback
      return apiSuccess({ email: raw });
    }

    // 2. Check by student_code, teacher_code, student_id, phone, or email slug prefix
    const upper = raw.toUpperCase();
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .or(
        `student_code.ilike.${upper},teacher_code.ilike.${upper},student_id.ilike.${raw},phone.eq.${raw},email.ilike.${raw.toLowerCase()}@%`
      )
      .maybeSingle();

    if (profile && profile.email) {
      return apiSuccess({ email: profile.email });
    }

    // 3. If it looks like a student code (e.g. HS...), fallback to student domain
    if (upper.startsWith('HS')) {
      return apiSuccess({ email: `${upper.toLowerCase()}@student.bhedu.vn` });
    }

    // Default fallback: return as @bhedu.vn or original
    return apiSuccess({ email: `${raw.toLowerCase()}@bhedu.vn` });
  }
);
