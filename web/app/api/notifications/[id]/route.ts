import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authSupabase = await createClientFromRequest(request);
    const { id } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
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

    const { error } = await serviceSupabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .or(`user_id.eq.${profileId},user_id.eq.${user.id}`);

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authSupabase = await createClientFromRequest(request);
    const { id } = await params;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();
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

    const { error } = await serviceSupabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .or(`user_id.eq.${profileId},user_id.eq.${user.id}`);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/notifications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
      }
    );
  }
}
