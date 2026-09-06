/**
 * Student Requests API
 * GET /api/requests - List requests with role-based scoping
 * POST /api/requests - Submit a new student request
 */

import { NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase/server';
import { studentRequestRepository } from '@/lib/repositories/StudentRequestRepository';
import { studentRequestService } from '@/lib/services/StudentRequestService';
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

    // Get user profile role
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const request_type = searchParams.get('request_type') || undefined;
    const class_id = searchParams.get('class_id') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

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
      const { data: links } = await supabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_id', profile.id);

      const studentIds = links?.map((l: any) => l.student_id) || [];
      const requestedStudent = searchParams.get('student_id');

      if (requestedStudent && studentIds.includes(requestedStudent)) {
        filters.student_id = requestedStudent;
      } else if (studentIds.length > 0) {
        filters.student_id = studentIds[0];
      } else {
        return NextResponse.json({ success: true, data: [], total: 0 });
      }
    } else if (profile.role === 'teacher') {
      // Teachers can view all requests or filter by their classes
      if (!filters.class_id) {
        const { data: teacherClasses } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', profile.id);

        if (teacherClasses && teacherClasses.length > 0) {
          // If viewing general list, can show their class requests
        }
      }
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Determine parent_id if submitted by parent
    let parent_id = parsed.data.parent_id;
    if (profile.role === 'parent') {
      parent_id = profile.id;
    }

    const created = await studentRequestService.submitRequest({
      ...parsed.data,
      parent_id,
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
