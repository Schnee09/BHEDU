/**
 * Admin Grades API (Vietnamese Education System)
 * GET /api/admin/grades - Get all grades with filtering
 * POST /api/admin/grades - Create/update grades with full metadata
 *
 * Required fields for POST:
 * - student_id: UUID of the student
 * - class_id: UUID of the class
 * - subject_id: UUID of the subject
 * - component_type: Grade component (oral, fifteen_min, one_period, midterm, final)
 * - semester: Semester identifier ("1" or "2")
 * - score: Numeric score (0-10)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { getAuthContext } from '@/lib/auth/guard';
import { getGradeSemesterAliases, normalizeGradeSemester } from '@/lib/grades/semester';
import { canAccessClass } from '@/lib/auth/classAccess';

const VALID_COMPONENT_TYPES = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final'];
const VALID_SEMESTERS = ['1', '2'];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request, 'grades.manage');
    if (!auth.profile) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền quản lý điểm.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('student_id');
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const semester = searchParams.get('semester');
    const componentType = searchParams.get('component_type');

    const { supabase } = await getDataClient(request);
    let scopedStudentId = studentId;
    let scopedClassIds: string[] | null = null;
    let scopedStudentIds: string[] | null = null;

    if (!['admin', 'owner', 'super_admin', 'student', 'parent'].includes(auth.role)) {
      if (classId) {
        if (!(await canAccessClass(supabase, { id: auth.profile.id, role: auth.role }, classId))) {
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
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
          return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }
      } else {
        scopedStudentIds = linkedStudentIds;
        if (scopedStudentIds.length === 0) {
          return NextResponse.json({ success: true, data: [], total: 0 });
        }
      }
    } else if (!['admin', 'owner', 'super_admin'].includes(auth.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Build query using new schema
    let query = supabase
      .from('grades')
      .select(
        `
        *,
        student:profiles!grades_student_id_fkey(id, full_name, email, student_code),
        class:classes!grades_class_id_fkey(id, name),
        subject:subjects!grades_subject_id_fkey(id, name, code)
      `
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (scopedStudentId) query = query.eq('student_id', scopedStudentId);
    if (scopedStudentIds) query = query.in('student_id', scopedStudentIds);
    if (classId) query = query.eq('class_id', classId);
    if (scopedClassIds) query = query.in('class_id', scopedClassIds);
    if (subjectId) query = query.eq('subject_id', subjectId);
    if (semester) {
      const semesterAliases = getGradeSemesterAliases(semester);
      if (semesterAliases.length === 0) {
        return NextResponse.json({ success: true, data: [], total: 0 });
      }
      query = query.in('semester', semesterAliases);
    }
    if (componentType) query = query.eq('component_type', componentType);

    const { data: gradeData, error: gradeError } = await query;
    if (gradeError) throw gradeError;

    return NextResponse.json({
      success: true,
      data: gradeData || [],
      total: gradeData?.length || 0,
    });
  } catch (error: any) {
    console.error('[API] Grades error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request, 'grades.manage');
    if (!auth.profile) {
      return NextResponse.json({ success: false, error: 'Vui lòng đăng nhập.' }, { status: 401 });
    }
    if (!auth.authorized || !auth.role) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền quản lý điểm.' },
        { status: 403 }
      );
    }

    const { supabase } = await getDataClient(request);
    const body = await request.json();
    const { student_id, class_id, subject_id, component_type, semester, score, feedback } = body;
    const normalizedSemester = normalizeGradeSemester(semester);

    // Validate required fields
    if (
      !student_id ||
      !class_id ||
      !subject_id ||
      !component_type ||
      !semester ||
      score === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'student_id, class_id, subject_id, component_type, semester, and score are required',
        },
        { status: 400 }
      );
    }

    // Validate component_type
    if (!VALID_COMPONENT_TYPES.includes(component_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid component_type. Must be one of: ${VALID_COMPONENT_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate semester
    if (!normalizedSemester || !VALID_SEMESTERS.includes(normalizedSemester)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid semester. Must be one of: ${VALID_SEMESTERS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate score (Vietnamese 0-10 scale)
    if (score < 0 || score > 10) {
      return NextResponse.json(
        { success: false, error: 'Score must be between 0 and 10' },
        { status: 400 }
      );
    }

    if (!(await canAccessClass(supabase, { id: auth.profile.id, role: auth.role }, class_id))) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('grades')
      .upsert(
        {
          student_id,
          class_id,
          subject_id,
          component_type,
          semester: normalizedSemester,
          score,
          points_earned: score,
          feedback: feedback || null,
          graded_by: auth.profile.id,
          graded_at: new Date().toISOString(),
          deleted_at: null,
        },
        {
          onConflict: 'student_id,class_id,subject_id,component_type,semester',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[API] Create/update grade error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
