/**
 * Student Requests API
 * GET /api/requests - List requests with role-based scoping
 * POST /api/requests - Submit a new student request
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest, createServiceClient } from '@/lib/supabase/server';
import { studentRequestRepository } from '@/lib/repositories/StudentRequestRepository';
import { studentRequestService } from '@/lib/services/StudentRequestService';
import { canSubmitStudentRequest } from '@/lib/auth/studentRequestAccess';
import type { UserRole } from '@/lib/auth/core';
import { z } from 'zod';

const createRequestSchema = z.object({
  student_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  request_type: z.enum(['leave_absence', 'makeup_class', 'class_transfer', 'deferral']),
  class_id: z.string().uuid().optional().nullable(),
  target_class_id: z.string().uuid().optional().nullable(),
  request_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  reason: z.string().min(5, 'Lý do phải có ít nhất 5 ký tự'),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function GET(request: Request) {
  try {
    const supabase = createClientFromRequest(request as any);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceSupabase = createServiceClient();

    // Get user profile role via service client with fallback on user_id and id
    let { data: profile } = await serviceSupabase
      .from('profiles')
      .select('id, user_id, role, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const result = await serviceSupabase
        .from('profiles')
        .select('id, user_id, role, full_name')
        .eq('id', user.id)
        .maybeSingle();
      profile = result.data;
    }

    if (!profile) {
      return NextResponse.json({ success: true, data: [], total: 0 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const request_type = searchParams.get('request_type') || undefined;
    const class_id = searchParams.get('class_id') || undefined;
    const parsedLimit = parseInt(searchParams.get('limit') || '50', 10);
    const parsedOffset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, parsedLimit)) : 50;
    const offset = Number.isFinite(parsedOffset) ? Math.max(0, parsedOffset) : 0;

    const filters: any = {
      status,
      request_type,
      class_id,
      limit,
      offset,
    };

    // Role-based data scoping
    if (profile.role === 'student') {
      filters.student_id = profile.id;
    } else if (profile.role === 'parent') {
      // Find linked students
      const { data: links } = await serviceSupabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_id', profile.id);

      const studentIds = links?.map((l: any) => l.student_id) || [];
      const requestedStudent = searchParams.get('student_id');

      if (requestedStudent && studentIds.includes(requestedStudent)) {
        filters.student_id = requestedStudent;
      } else {
        filters.student_ids = studentIds;
      }
    } else if (profile.role === 'teacher') {
      const { data: teacherClasses } = await serviceSupabase
        .from('classes')
        .select('id')
        .eq('teacher_id', profile.id);
      const classIds = teacherClasses?.map((item: { id: string }) => item.id) || [];

      if (filters.class_id) {
        if (!classIds.includes(filters.class_id)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        filters.class_ids = classIds;
      }
    } else if (!['admin', 'owner', 'super_admin', 'staff'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await studentRequestRepository.findRequests(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error: any) {
    console.error('Error in GET /api/requests:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClientFromRequest(request as any);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const serviceSupabase = createServiceClient();
    let { data: profile } = await serviceSupabase
      .from('profiles')
      .select('id, user_id, role, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const result = await serviceSupabase
        .from('profiles')
        .select('id, user_id, role, full_name')
        .eq('id', user.id)
        .maybeSingle();
      profile = result.data;
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const studentId = parsed.data.student_id;
    let parentId: string | null = null;
    let hasApprovedParentLink = false;

    if (profile.role === 'parent') {
      const { data: link } = await serviceSupabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_id', profile.id)
        .eq('student_id', studentId)
        .eq('status', 'approved')
        .maybeSingle();

      hasApprovedParentLink = !!link;
      if (hasApprovedParentLink) parentId = profile.id;
    }

    if (
      !canSubmitStudentRequest(
        profile.role as UserRole,
        profile.id,
        studentId,
        hasApprovedParentLink
      )
    ) {
      return NextResponse.json(
        { error: 'Bạn không thể gửi đơn cho học sinh này' },
        { status: 403 }
      );
    }

    if (parsed.data.class_id && ['student', 'parent'].includes(profile.role)) {
      const { data: enrollment } = await serviceSupabase
        .from('enrollments')
        .select('id')
        .eq('student_id', studentId)
        .eq('class_id', parsed.data.class_id)
        .maybeSingle();

      if (!enrollment) {
        return NextResponse.json({ error: 'Học sinh không thuộc lớp đã chọn' }, { status: 403 });
      }
    }

    const created = await studentRequestService.submitRequest({
      ...parsed.data,
      student_id: studentId,
      parent_id: parentId,
    });

    return NextResponse.json({
      success: true,
      data: created,
      message: 'Gửi đơn trực tuyến thành công',
    });
  } catch (error: any) {
    console.error('Error in POST /api/requests:', error);
    return NextResponse.json({ error: error.message || 'Không thể tạo đơn' }, { status: 500 });
  }
}
