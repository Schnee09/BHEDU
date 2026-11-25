/**
 * Student Status Workflow (admin)
 * PATCH /api/admin/students/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { logger } from '@/lib/logger';
import { canAccessStudent } from '@/lib/auth/classAccess';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const allowedStatuses = ['active', 'inactive', 'graduated', 'suspended'] as const;
type StudentStatus = (typeof allowedStatuses)[number];

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext(req, 'students.edit');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const status = body?.status as StudentStatus | undefined;
    const reason = typeof body?.reason === 'string' ? body.reason : undefined;

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { supabase } = await getDataClient(req);
    if (
      !auth.role ||
      !(await canAccessStudent(supabase, { id: auth.profile.id, role: auth.role }, id))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate student exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, role, status, full_name')
      .eq('id', id)
      .maybeSingle();

    if (!existing || existing.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) {
      logger.error('Failed to update student status', { error: error.message, studentId: id });
      return NextResponse.json(
        { error: error.message || 'Failed to update status' },
        { status: 500 }
      );
    }

    await supabase.from('audit_logs').insert({
      actor_id: auth.profile.id,
      action: 'update',
      resource_type: 'student',
      resource_id: id,
      details: { previous_status: existing.status, new_status: status, reason },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    logger.error('Failed to update student status', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
