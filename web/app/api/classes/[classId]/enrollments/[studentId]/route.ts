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
    const { status, reason, end_date: endDate } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['dropped', 'completed', 'withdrawn'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Chỉ có thể kết thúc ghi danh tại endpoint này. Hãy tạo lượt ghi danh mới để học lại.',
        },
        { status: 400 }
      );
    }
    if (typeof reason !== 'string' || reason.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Lý do kết thúc phải có ít nhất 3 ký tự' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: enrollment, error: findError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('status', 'enrolled')
      .is('deleted_at', null)
      .maybeSingle();

    if (findError || !enrollment) {
      return NextResponse.json(
        { success: false, error: findError?.message || 'Không tìm thấy ghi danh đang học' },
        { status: findError ? 500 : 404 }
      );
    }

    const { data, error } = await supabase.rpc('end_enrollment_atomic', {
      p_enrollment_id: enrollment.id,
      p_end_date: endDate || new Date().toISOString().slice(0, 10),
      p_status: status,
      p_reason: reason.trim(),
      p_actor_id: authResult.userId,
    });

    if (error) {
      console.error('Error updating enrollment:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      enrollment: Array.isArray(data) ? data[0] : data,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/classes/[classId]/enrollments/[studentId]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
