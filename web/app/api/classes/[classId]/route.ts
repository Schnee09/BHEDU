/**
 * Classes API - Resource Detail (Unified)
 * GET/PATCH/DELETE /api/classes/[classId]
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitIdentifier, rateLimitConfigs } from '@/lib/auth/rateLimit';
import { adminAuth, teacherAuth } from '@/lib/auth/adminAuth';
import { ClassRepository } from '@/lib/repositories/ClassRepository';
import { createServiceClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation Schemas
const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subject_id: z.string().optional().nullable(),
  teacher_id: z.string().optional().nullable(),
  room: z.string().max(100).optional().nullable(),
  schedule: z.string().max(200).optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  academic_year_id: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'completed']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    // Rate limit
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
        }
      );
    }

    // Auth
    const auth = await teacherAuth(request);

    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || 'Unauthorized' },
        {
          status: 401,
        }
      );
    }

    const includeStudents = request.nextUrl.searchParams.get('include_students') === 'true';
    const includeTimetable = request.nextUrl.searchParams.get('include_timetable') === 'true';

    const supabase = createServiceClient();
    const repository = new ClassRepository(supabase);

    // Parallel fetch class details, students, and timetable slots
    const promises: Promise<any>[] = [repository.findByIdWithDetails(classId)];

    if (includeStudents) {
      promises.push(
        supabase
          .from('enrollments')
          .select('id, student_id, status, enrollment_date, student:profiles!enrollments_student_id_fkey(id, email, full_name, student_code, grade_level)')
          .eq('class_id', classId)
          .then(res => res) as Promise<any>
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (includeTimetable) {
      promises.push(
        supabase
          .from('timetable_slots')
          .select('id, day_of_week, start_time, end_time, room, notes, subject:subjects(id, name, code), teacher:profiles!timetable_slots_teacher_id_fkey(id, full_name)')
          .eq('class_id', classId)
          .then(res => res) as Promise<any>
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    const [cls, studentsRes, timetableRes] = await Promise.all(promises);

    if (!cls) {
      return NextResponse.json(
        { error: 'Class not found' },
        {
          status: 404,
        }
      );
    }

    const responseData = { ...cls } as any;

    if (includeStudents && studentsRes) {
      const { data: enrollments } = studentsRes;
      responseData.students = (enrollments || [])
        .map((e: any) => ({
          id: e.student_id,
          student_id: e.student_id,
          enrollment_id: e.id,
          enrollment_date: e.enrollment_date,
          status: e.status || 'enrolled',
          ...(e.student || {}),
        }))
        .filter((s: any) => s.full_name);
    }

    if (includeTimetable && timetableRes) {
      responseData.timetable = timetableRes.data || [];
    }

    return NextResponse.json({ success: true, class: responseData });
  } catch (error) {
    console.error('[API] GET /api/classes/[classId] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    // Rate limit
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
        }
      );
    }

    // Auth - staff/admin only
    const auth = await adminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        {
          status: 403,
        }
      );
    }

    // Parse body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        {
          status: 400,
        }
      );
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const repository = new ClassRepository(supabase);

    const updated = await repository.update(classId, parsed.data);
    return NextResponse.json({ success: true, class: updated });
  } catch (error) {
    console.error('[API] PATCH /api/classes/[classId] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    // Rate limit
    const identifier = getRateLimitIdentifier(request);
    const rateCheck = checkRateLimit(identifier, rateLimitConfigs.api);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
        }
      );
    }

    // Auth - staff/admin only
    const auth = await adminAuth(request);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        {
          status: 403,
        }
      );
    }

    const supabase = createServiceClient();
    const repository = new ClassRepository(supabase);

    await repository.delete(classId);
    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('[API] DELETE /api/classes/[classId] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      {
        status: 500,
      }
    );
  }
}
