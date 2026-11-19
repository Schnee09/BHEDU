/**
 * Student Enrollments (admin)
 * GET /api/admin/students/[id]/enrollments
 *
 * Used by the student detail page EnrollmentManager.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { logger } from '@/lib/logger';
import { EnrollmentRepository } from '@/lib/repositories/EnrollmentRepository';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getAuthContext(req, 'students.view');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { supabase } = await getDataClient(req);
    const repository = new EnrollmentRepository(supabase);

    // Verify student exists
    const { data: student } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const enrollmentRows = await repository.findByStudent(id);

    const enrollments = (enrollmentRows || []).map((row) => ({
      id: row.id,
      class_id: row.class_id,
      class_name: row.class?.name ?? row.class_id,
      class_code: row.class?.code ?? '',
      schedule: row.class?.schedule ?? undefined,
      teacher_name: row.class?.teacher?.full_name ?? undefined,
      enrollment_date: row.enrollment_date,
      end_date: row.end_date,
      status: row.status,
      status_reason: row.status_reason,
      previous_enrollment_id: row.previous_enrollment_id,
    }));

    return NextResponse.json({ success: true, enrollments });
  } catch (err) {
    logger.error('Failed to fetch student enrollments', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
