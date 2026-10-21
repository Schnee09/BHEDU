import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const optionalNullableText = (max: number) =>
  z.union([z.string().trim().max(max), z.null()]).optional();

const profileUpdateSchema = z
  .object({
    full_name: z.string().trim().min(1, 'Họ và tên không được để trống').max(200),
    first_name: optionalNullableText(100),
    last_name: optionalNullableText(100),
    phone: z
      .union([
        z
          .string()
          .trim()
          .regex(/^\+?[0-9]{8,15}$/, 'Số điện thoại không hợp lệ'),
        z.literal(''),
        z.null(),
      ])
      .optional(),
    address: optionalNullableText(500),
    date_of_birth: z
      .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(''), z.null()])
      .optional(),
    personal_email: z
      .union([z.string().trim().email().max(254), z.literal(''), z.null()])
      .optional(),
    photo_url: z.union([z.string().url().max(2048), z.literal(''), z.null()]).optional(),
  })
  .strict();

export async function GET(request: Request) {
  try {
    const authSupabase = createClientFromRequest(request);
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Profile fetch failed: Not authenticated', { authError });
      return NextResponse.json(
        { error: 'Not authenticated', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    const serviceSupabase = createServiceClient();

    let { data: profile, error } = await serviceSupabase
      .from('profiles')
      .select(
        `id, user_id, full_name, first_name, last_name, role, email, phone, address,
         date_of_birth, personal_email, photo_url, created_at,
         student_code, student_id, grade_level,
         teacher_code, department,
         teacher_profiles(teacher_type, department, specialization)`
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile && !error) {
      // TODO: Remove legacy ID fallback once migration is fully verified
      logger.info('Profile not found by user_id, trying id fallback', { userId: user.id });
      const result = await serviceSupabase
        .from('profiles')
        .select(
          `id, user_id, full_name, first_name, last_name, role, email, phone, address,
         date_of_birth, personal_email, photo_url, created_at,
         student_code, student_id, grade_level,
         teacher_code, department,
         teacher_profiles(teacher_type, department, specialization)`
        )
        .eq('id', user.id)
        .maybeSingle();
      profile = result.data;
      error = result.error;
    }

    if (error) {
      logger.error('Database error fetching profile:', error, { userId: user.id });
      return NextResponse.json(
        {
          error: error.message || 'Failed to fetch profile from database',
          code: error.code || 'DATABASE_ERROR',
          details: error.details,
        },
        { status: 500 }
      );
    }

    if (!profile) {
      logger.warn('Profile not found for authenticated user', { userId: user.id });
      return NextResponse.json({ error: 'Profile not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const res = NextResponse.json(profile);
    res.cookies.set('user-role', `${user.id}:${profile.role}`, {
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res;
  } catch (err: any) {
    logger.error('Unexpected error in GET /api/profile:', err);
    return NextResponse.json(
      {
        error: err.message || 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // 1. Authenticate
    const authSupabase = createClientFromRequest(request);
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json().catch(() => null);
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu hồ sơ không hợp lệ', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      full_name,
      first_name,
      last_name,
      phone,
      address,
      date_of_birth,
      personal_email,
      photo_url,
    } = parsed.data;

    // 3. Build safe payload — never touch id, role, email, user_id directly
    const updatePayload: Record<string, unknown> = {
      full_name,
      first_name: first_name || null,
      last_name: last_name || null,
      phone: phone || null,
      address: address || null,
      date_of_birth: date_of_birth || null,
      personal_email: personal_email || null,
      photo_url: photo_url || null,
      updated_at: new Date().toISOString(),
    };

    // 4. Use service client to bypass RLS for the write
    const serviceSupabase = createServiceClient();

    // Try matching by user_id first (preferred), fallback to id (legacy accounts)
    let { data: updated, error } = await serviceSupabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id)
      .select(
        'id, full_name, first_name, last_name, phone, address, date_of_birth, personal_email, photo_url'
      )
      .maybeSingle();

    if (!updated && !error) {
      // Legacy: profile.id === auth.uid
      const result = await serviceSupabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', user.id)
        .select(
          'id, full_name, first_name, last_name, phone, address, date_of_birth, personal_email, photo_url'
        )
        .maybeSingle();
      updated = result.data;
      error = result.error;
    }

    if (error) {
      logger.error('Profile update failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ' }, { status: 404 });
    }

    // 5. Record activity in audit_logs
    try {
      const { error: logErr } = await serviceSupabase.from('audit_logs').insert({
        user_id: updated.id,
        user_email: user.email,
        action: 'user.updated',
        resource_type: 'profile',
        resource_id: updated.id,
        new_data: {
          full_name: updated.full_name,
          phone: updated.phone,
          address: updated.address,
          date_of_birth: updated.date_of_birth,
          personal_email: updated.personal_email,
        },
      });
    } catch (auditErr) {
      logger.warn('Failed to record profile update audit log', { auditErr });
    }

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    logger.error('Unexpected error in PATCH /api/profile:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
