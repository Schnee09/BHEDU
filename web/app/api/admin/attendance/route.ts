/**
 * Admin Attendance API
 * GET/POST /api/admin/attendance
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { getAuthContext } from '@/lib/auth/guard';
import { handleApiError, ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logger';
import { createAttendanceSchema } from '@/lib/schemas';
import { canAccessClass } from '@/lib/auth/classAccess';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request, 'attendance.view');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { supabase } = await getDataClient(request);
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('student_id');
    const classId = searchParams.get('class_id');
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    let scopedStudentId = studentId;
    let scopedClassIds: string[] | null = null;
    let scopedStudentIds: string[] | null = null;

    if (!['admin', 'owner', 'super_admin', 'student', 'parent'].includes(auth.role)) {
      if (classId) {
        if (!(await canAccessClass(supabase, { id: auth.profile.id, role: auth.role }, classId))) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        const { data: assignedClasses, error: assignedClassesError } = await supabase
          .from('classes')
          .select('id')
          .eq('teacher_id', auth.profile.id);
        if (assignedClassesError) {
          throw new Error(`Failed to verify assigned classes: ${assignedClassesError.message}`);
        }
        scopedClassIds = (assignedClasses || []).map((item) => item.id);
        if (scopedClassIds.length === 0) {
          return NextResponse.json({ success: true, data: [], total: 0 });
        }
      }
    } else if (auth.role === 'student') {
      scopedStudentId = auth.profile.id;
    } else if (auth.role === 'parent') {
      const { data: links, error: linksError } = await supabase
        .from('parent_student_links')
        .select('student_id')
        .eq('parent_id', auth.profile.id)
        .eq('status', 'approved');
      if (linksError) {
        throw new Error(`Failed to verify linked students: ${linksError.message}`);
      }
      const linkedStudentIds = (links || []).map((link) => link.student_id);
      if (studentId) {
        if (!linkedStudentIds.includes(studentId)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else {
        scopedStudentIds = linkedStudentIds;
        if (scopedStudentIds.length === 0) {
          return NextResponse.json({ success: true, data: [], total: 0 });
        }
      }
    } else if (!['admin', 'owner', 'super_admin'].includes(auth.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // First, get attendance records
    let query = supabase
      .from('attendance')
      .select('*')
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (scopedStudentId) query = query.eq('student_id', scopedStudentId);
    if (scopedStudentIds) query = query.in('student_id', scopedStudentIds);
    if (classId) query = query.eq('class_id', classId);
    if (scopedClassIds) query = query.in('class_id', scopedClassIds);
    if (date) query = query.eq('date', date);
    if (status) query = query.eq('status', status);

    const { data: attendanceData, error: attendanceError } = await query;
    if (attendanceError) {
      logger.error('Attendance fetch error:', { error: attendanceError });
      throw new Error(`Database error: ${attendanceError.message}`);
    }

    if (!attendanceData || attendanceData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Get unique student and class IDs
    const studentIds = [...new Set(attendanceData.map((a) => a.student_id))];
    const classIds = [...new Set(attendanceData.map((a) => a.class_id))];

    // Fetch students
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', studentIds);

    // Fetch classes
    const { data: classes } = await supabase.from('classes').select('id, name').in('id', classIds);

    // Create lookup maps
    const studentMap = new Map(students?.map((s) => [s.id, s]) || []);
    const classMap = new Map(classes?.map((c) => [c.id, c]) || []);

    // Combine data
    const enrichedData = attendanceData.map((attendance) => ({
      ...attendance,
      student: studentMap.get(attendance.student_id) || null,
      class: classMap.get(attendance.class_id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedData,
      total: enrichedData.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request, 'attendance.manage');
    if (!auth.profile) {
      return NextResponse.json({ error: auth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json({ error: auth.reason || 'Forbidden' }, { status: 403 });
    }

    const { supabase } = await getDataClient(request);
    const parsed = createAttendanceSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError('Invalid attendance data');
    }
    const { student_id, class_id, date, status, notes } = parsed.data;
    if (!(await canAccessClass(supabase, { id: auth.profile.id, role: auth.role }, class_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const attendanceRecord = {
      status,
      remarks: notes ?? null,
      marked_by: auth.profile.id,
      deleted_at: null,
    };

    // Check if record exists for this student/class/date
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('student_id', student_id)
      .eq('class_id', class_id)
      .eq('date', date)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('attendance')
        .update(attendanceRecord)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        logger.error('Update attendance error:', { error });
        throw new Error(`Database error: ${error.message}`);
      }
      return NextResponse.json({ success: true, data });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          student_id,
          class_id,
          date,
          ...attendanceRecord,
        })
        .select()
        .single();

      if (error) {
        logger.error('Create attendance error:', { error });
        throw new Error(`Database error: ${error.message}`);
      }
      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
