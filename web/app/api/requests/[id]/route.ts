/**
 * Student Request Detail API
 * PATCH /api/requests/[id] - Review / update request status
 * DELETE /api/requests/[id] - Delete request
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { studentRequestRepository } from '@/lib/repositories/StudentRequestRepository';
import { studentRequestService } from '@/lib/services/StudentRequestService';
import { z } from 'zod';

const reviewRequestSchema = z.object({
  status: z.enum(['approved', 'rejected', 'cancelled']),
  reviewer_note: z.string().optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const requestId = resolvedParams.id;

    const supabase = createClientFromRequest(request as any);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = reviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Permission check
    const existing = await studentRequestRepository.findById(requestId);
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 });
    }

    // If user is student/parent, they can only cancel their own pending request
    if (profile.role === 'student' || profile.role === 'parent') {
      const isOwner = existing.student_id === profile.id || existing.parent_id === profile.id;
      if (!isOwner || parsed.data.status !== 'cancelled') {
        return NextResponse.json(
          { error: 'Bạn chỉ có thể hủy đơn đang chờ duyệt của mình' },
          { status: 403 }
        );
      }
    }

    const updated = await studentRequestService.reviewRequest(requestId, {
      status: parsed.data.status,
      reviewer_id: profile.id,
      reviewer_note: parsed.data.reviewer_note,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Đã ${
        parsed.data.status === 'approved'
          ? 'phê duyệt'
          : parsed.data.status === 'rejected'
            ? 'từ chối'
            : 'hủy'
      } đơn thành công`,
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/requests/[id]:', error);
    return NextResponse.json({ error: error.message || 'Không thể cập nhật đơn' }, { status: 500 });
  }
}
