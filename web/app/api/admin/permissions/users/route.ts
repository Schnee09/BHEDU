/**
 * Admin Permissions Users Listing API
 * GET /api/admin/permissions/users - List users with pagination and search for permission management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/guard';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const auth = await getAuthContext(request, 'permissions.manage');
    if (!auth.authorized || !auth.profile) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.user ? 403 : 401 }
      );
    }

    // 2. Parse pagination & search params
    const parsedPage = parseInt(searchParams.get('page') || '1', 10);
    const parsedLimit = parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 20;
    const search = searchParams.get('search')?.trim().slice(0, 200);
    const role = searchParams.get('role')?.trim().slice(0, 50);

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
