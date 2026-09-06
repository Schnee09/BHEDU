import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/sidebar/badge-counts
 *
 * Consolidated endpoint that returns all sidebar badge counts in a single
 * request. Replaces 3 separate API calls the Sidebar was making.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch profile to determine role
    const serviceClient = createServiceClient();
    let { data: profile } = await serviceClient
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const result = await serviceClient
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();
      profile = result.data;
    }

    const role = profile?.role ?? '';

    const profileId = profile?.id || user.id;

    // Run actionable badge queries in parallel for minimum latency
    const [notificationsResult, parentLinksResult] = await Promise.allSettled([
      // 1. Unread notifications count
      serviceClient
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${profileId},user_id.eq.${user.id}`)
        .eq('is_read', false),

      // 2. Pending parent links (admin/owner/super_admin only)
      ['admin', 'owner', 'super_admin'].includes(role)
        ? serviceClient
            .from('parent_student_links')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
        : Promise.resolve({ count: 0, error: null }),
    ]);

    const counts: Record<string, number> = {};

    if (notificationsResult.status === 'fulfilled' && !notificationsResult.value.error) {
      counts.notifications = notificationsResult.value.count ?? 0;
    }

    if (parentLinksResult.status === 'fulfilled' && !parentLinksResult.value.error) {
      counts.pendingParentLinks = parentLinksResult.value.count ?? 0;
    }

    return NextResponse.json({ success: true, counts });
  } catch (error) {
    console.error('Error in GET /api/sidebar/badge-counts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
