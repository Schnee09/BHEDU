/**
 * Permission Management API
 * CRUD operations for user permissions with audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';

// GET /api/admin/permissions - Get all permission definitions
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);
    
    // Check if user is admin
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

    // Get permission definitions
    const { data: definitions, error: defError } = await supabase
      .from('permission_definitions')
      .select('*')
      .order('category')
      .order('code');

    if (defError) {
      console.error('Failed to fetch definitions:', defError);
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
    }

    // Get role permissions
    const { data: rolePerms } = await supabase
      .from('role_permissions')
      .select('*');

    return NextResponse.json({
      definitions,
      rolePermissions: rolePerms || [],
    });
  } catch (error) {
    console.error('Permission API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
