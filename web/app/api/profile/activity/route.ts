import { NextResponse } from 'next/server';
import { createServiceClient, createClientFromRequest } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const authSupabase = createClientFromRequest(request);
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();

    // 1. Get profile.id for this auth user
    let { data: profile } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile && user.email) {
      const byEmail = await serviceSupabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();
      profile = byEmail.data;
    }

    const profileId = profile?.id || user.id;

    // 2. Query audit logs matching profileId or email
    let query = serviceSupabase
      .from('audit_logs')
      .select('id, action, resource_type, created_at, new_data')
      .order('created_at', { ascending: false })
      .limit(10);

    if (user.email) {
      query = query.or(`user_id.eq.${profileId},user_email.eq.${user.email}`);
    } else {
      query = query.eq('user_id', profileId);
    }

    const { data: logs, error } = await query;

    if (error) {
      logger.error('Failed to fetch profile activities from database', { error, userId: user.id });
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json({ data: logs || [] });
  } catch (err: any) {
    logger.error('Unexpected error in GET /api/profile/activity', err);
    return NextResponse.json({ data: [] });
  }
}
