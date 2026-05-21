import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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
        'id, user_id, full_name, first_name, last_name, role, email, phone, address, date_of_birth, personal_email, photo_url'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile && !error) {
      // TODO: Remove legacy ID fallback once migration is fully verified
      logger.info('Profile not found by user_id, trying id fallback', { userId: user.id });
      const result = await serviceSupabase
        .from('profiles')
        .select(
          'id, user_id, full_name, first_name, last_name, role, email, phone, address, date_of_birth, personal_email, photo_url'
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
    const body = await request.json();
    const {
      full_name,
      first_name,
      last_name,
      phone,
      address,
      date_of_birth,
      personal_email,
      photo_url,
    } = body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Họ và tên không được để trống' }, { status: 400 });
    }

    // 3. Build safe payload — never touch id, role, email, user_id directly
    const updatePayload: Record<string, unknown> = {
      full_name: full_name.trim(),
      first_name: first_name?.trim() || null,
      last_name: last_name?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      date_of_birth: date_of_birth || null,
      personal_email: personal_email?.trim() || null,
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

    return NextResponse.json({ profile: updated });
  } catch (err: any) {
    logger.error('Unexpected error in PATCH /api/profile:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
