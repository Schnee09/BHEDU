/**
 * Permission Audit Logs API
 * View audit history for permission changes
 */

import { NextResponse } from 'next/server';
import { createGetHandler } from '@/lib/api';
import { ValidationError } from '@/lib/api/errors';
import { createClientFromRequest } from '@/lib/supabase/server';

// GET /api/admin/permissions/audit - Get audit logs
export const GET = createGetHandler(
  { permission: 'permissions.manage' },
  async ({ request, searchParams }) => {
    const supabase = createClientFromRequest(request);

    const page = Number(searchParams.get('page') || '1');
    const limit = Number(searchParams.get('limit') || '50');
    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError('page must be a positive integer');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ValidationError('limit must be an integer between 1 and 100');
    }
    const userId = searchParams.get('user_id');
    const action = searchParams.get('action');
    const scope = searchParams.get('scope'); // 'user' | 'role' | null (all)

    // Build query
    let query = supabase
      .from('permission_audit_logs')
      .select(
        `
        *,
        user:profiles!permission_audit_logs_user_fkey (id, full_name, role),
        performer:profiles!permission_audit_logs_performer_fkey (id, full_name)
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (action) {
      query = query.eq('action', action);
    }
    if (scope) {
      query = query.eq('scope', scope);
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
  }
);
