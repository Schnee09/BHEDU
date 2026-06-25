/**
 * PATCH /api/classes/[classId]/enrollments/[studentId]
 * Update enrollment status for a student
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { adminAuth } from '@/lib/auth/adminAuth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  try {
    const authResult = await adminAuth(req);
    if (!authResult.authorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { classId, studentId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['enrolled', 'dropped', 'completed', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('enrollments')
      .update({ status })
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, enrollment: data });
  } catch (error: any) {
    console.error('Error in PATCH /api/classes/[classId]/enrollments/[studentId]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
