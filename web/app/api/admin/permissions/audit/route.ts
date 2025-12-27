/**
 * Permission Audit Logs API
 * View audit history for permission changes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';

// GET /api/admin/permissions/audit - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);
    const { searchParams } = new URL(request.url);
    
    // Check admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse query params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');

    // Build query
    let query = supabase
      .from('permission_audit_logs')
      .select(`
        *,
        user:profiles!permission_audit_logs_user_fkey (id, full_name, role),
        performer:profiles!permission_audit_logs_performer_fkey (id, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (action) {
      query = query.eq('action', action);
    }

    query = query.range((page - 1) * limit, page * limit - 1);

    const { data: logs, count, error } = await query;

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Audit logs API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
