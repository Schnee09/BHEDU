/**
 * Admin Permissions Users Listing API
 * GET /api/admin/permissions/users - List users with pagination and search for permission management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);
    const { searchParams } = new URL(request.url);

    // 1. Check admin / owner / super_admin authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('id, role')
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .maybeSingle();

    if (!['super_admin', 'admin', 'owner'].includes(currentProfile?.role || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 2. Parse pagination & search params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search')?.trim();
    const role = searchParams.get('role')?.trim();

    const serviceClient = createServiceClient();
    let query = serviceClient
      .from('profiles')
      .select('id, full_name, email, role, phone, student_code, teacher_code, is_active', {
        count: 'exact',
      });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      const escaped = search.replace(/[%_]/g, '\\$&');
      query = query.or(
        `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,student_code.ilike.%${escaped}%,teacher_code.ilike.%${escaped}%,phone.ilike.%${escaped}%`
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: users, count, error: queryError } = await query;

    if (queryError) {
      console.error('[Permissions Users API] Error querying users:', queryError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('[Permissions Users API] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
