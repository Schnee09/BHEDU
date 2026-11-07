/**
 * Grades API (REFACTORED)
 *
 * Manages student grades for assignments using the unified API handler.
 * GET/POST /api/grades
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { apiPaginated, apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import { bulkGradeEntrySchema, createGradeSchema, gradeQuerySchema } from '@/lib/schemas';
import { validateQuery } from '@/lib/api/validation';
import { canAccessClass } from '@/lib/auth/classAccess';

// GET /api/grades
export const GET = createGetHandler({ permission: 'grades.view' }, async ({ request, user }) => {
  // Validate query parameters
  const queryParams = validateQuery(request, gradeQuerySchema);
  const supabase = createServiceClient();
  const { page, limit } = queryParams;
  const rangeStart = (page - 1) * limit;
  const rangeEnd = rangeStart + limit - 1;

  // FORCE STUDENT SCOPING
  if (user.role === 'student') {
    queryParams.student_id = user.id;
  }

  // ========== PARENT SCOPE FILTER ==========
  if (user.role === 'parent') {
    // Get all linked students for this parent
    const { data: links } = await supabase
      .from('parent_student_links')
      .select('student_id')
      .eq('parent_id', user.id)
      .eq('status', 'approved');

    const linkedStudentIds = (links || []).map((l) => l.student_id);

    if (linkedStudentIds.length === 0) {
      return apiPaginated([], { page, pageSize: limit, total: 0 });
    }

    if (queryParams.student_id) {
      // If parent requested a specific student, verify they are linked
      if (!linkedStudentIds.includes(queryParams.student_id)) {
        return apiPaginated([], { page, pageSize: limit, total: 0 });
      }
    } else {
      // If no student specified, filter by all linked students
      queryParams.student_id = linkedStudentIds as any; // Supabase filter handles array? No, eq doesn't.
      // Wait, let's fix the query builder below to handle this.
    }

    // Set a flag for the query builder
    (queryParams as any)._linkedStudentIds = linkedStudentIds;
  }

  // ========== TEACHER SCOPE FILTER ==========
  let teacherClassIds: string[] | null = null;
  if (['teacher', 'tutor', 'staff'].includes(user.role)) {
    const { data: teacherClasses, error: teacherClassesError } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', user.id);

    if (teacherClassesError) {
      throw new Error('Failed to verify assigned classes');
    }

    teacherClassIds = (teacherClasses || []).map((c) => c.id);
    if (queryParams.class_id && !teacherClassIds.includes(queryParams.class_id)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (teacherClassIds.length === 0) {
      return apiPaginated([], { page, pageSize: limit, total: 0 });
    }
  }

  // Build query
  let query = supabase
    .from('grades')
    .select(
      `
    *,
    subject:subjects(id, name, code),
    academic_year:academic_years(id, name)
  `,
      { count: 'exact' }
    )
    .is('deleted_at', null);

  // Academic Filters
  if (queryParams.class_id) {
    query = query.eq('class_id', queryParams.class_id);
  }

  if (queryParams.subject_id) {
    query = query.eq('subject_id', queryParams.subject_id);
  }

  if (queryParams.semester) {
    query = query.eq('semester', queryParams.semester);
  }

  if (queryParams.component_type) {
    query = query.eq('component_type', queryParams.component_type);
  }

  if (queryParams.academic_year_id) {
    query = query.eq('academic_year_id', queryParams.academic_year_id);
  }

  if (queryParams.student_id) {
    if (Array.isArray(queryParams.student_id)) {
      query = query.in('student_id', queryParams.student_id);
    } else {
      query = query.eq('student_id', queryParams.student_id);
    }
  }

  // Teachers, tutors and assigned staff can only view grades from their own classes.
  if (teacherClassIds && !queryParams.class_id) {
    query = query.in('class_id', teacherClassIds);
  }

  const {
    data: grades,
    error,
    count,
  } = await query.order('graded_at', { ascending: false }).range(rangeStart, rangeEnd);

  if (error) {
    logger.error('Failed to fetch grades:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return apiPaginated(grades || [], { page, pageSize: limit, total: count || 0 });
});

// POST /api/grades
export const POST = createApiHandler({ permission: 'grades.manage' }, async ({ request, user }) => {
  const supabase = createServiceClient();
  const body = await request.json();
  const data = body as any;

  // Manual validation because it can be bulk or single
  let validatedData;
  try {
    if (data.grades && Array.isArray(data.grades)) {
      validatedData = bulkGradeEntrySchema.parse(data);
    } else {
      validatedData = createGradeSchema.parse(data);
    }
  } catch (e: any) {
    if (e.name === 'ZodError' || e.message.includes('invalid')) {
      logger.error('Grade validation failed', {
        error: e.errors || e.message,
        body: JSON.stringify(data).slice(0, 500),
        hasGrades: !!data.grades,
        isGradesArray: Array.isArray(data.grades),
      });
    }

    return NextResponse.json(
      { success: false, error: e.errors || e.message },
      {
        status: 400,
      }
    );
  }

  let targetClassId = validatedData.class_id || null;
  let targetSubjectId = validatedData.subject_id || null;
  let assignmentMaxPoints: number | null = null;
  const targetAssignmentId = validatedData.assignment_id || null;
  if (targetAssignmentId) {
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('class_id, max_points')
      .eq('id', targetAssignmentId)
      .maybeSingle();
    if (assignmentError || !assignment?.class_id) {
      return NextResponse.json(
        { success: false, error: 'Assignment class could not be resolved' },
        { status: 400 }
      );
    }

    if (targetClassId && targetClassId !== assignment.class_id) {
      return NextResponse.json(
        { success: false, error: 'Assignment does not belong to the provided class' },
        { status: 400 }
      );
    }

    targetClassId = assignment.class_id;
    assignmentMaxPoints = Number(assignment.max_points);
    if (!Number.isFinite(assignmentMaxPoints) || assignmentMaxPoints <= 0) {
      return NextResponse.json(
        { success: false, error: 'Assignment has an invalid point scale' },
        { status: 400 }
      );
    }

    const { data: targetClass, error: classError } = await supabase
      .from('classes')
      .select('subject_id')
      .eq('id', targetClassId)
      .maybeSingle();
    if (classError || !targetClass?.subject_id) {
      return NextResponse.json(
        { success: false, error: 'Assignment subject could not be resolved' },
        { status: 400 }
      );
    }
    if (targetSubjectId && targetSubjectId !== targetClass.subject_id) {
      return NextResponse.json(
        { success: false, error: 'Assignment does not belong to the provided subject' },
        { status: 400 }
      );
    }
    targetSubjectId = targetClass.subject_id;
  }

  if (!targetClassId) {
    return NextResponse.json(
      { success: false, error: 'class_id or assignment_id is required' },
      { status: 400 }
    );
  }

  if (!(await canAccessClass(supabase, { id: user.id, role: user.role }, targetClassId))) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  // Resolve academic year if "current"
  let academicYearId = validatedData.academic_year_id;
  if (academicYearId === 'current') {
    const { data: currentAY, error: ayError } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single();

    if (ayError || !currentAY) {
      logger.error('Failed to resolve current academic year', ayError);
      throw new Error('Current academic year not found');
    }
    academicYearId = currentAY.id;
  }

  const submittedRows = 'grades' in validatedData ? validatedData.grades : [validatedData];
  if (
    assignmentMaxPoints !== null &&
    submittedRows.some((row) => (row.points_earned ?? row.score ?? 0) > assignmentMaxPoints)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: `Points earned cannot exceed assignment maximum (${assignmentMaxPoints})`,
      },
      { status: 400 }
    );
  }

  const normalizeRow = (row: any, metadata: any = {}) => {
    const pointsEarned = row.points_earned ?? row.score ?? null;
    const normalizedScore =
      pointsEarned !== null && assignmentMaxPoints !== null
        ? Math.round(((pointsEarned / assignmentMaxPoints) * 10 + Number.EPSILON) * 100) / 100
        : pointsEarned;

    return {
      student_id: row.student_id,
      class_id: row.class_id || metadata.class_id || targetClassId,
      assignment_id: row.assignment_id || metadata.assignment_id || targetAssignmentId,
      subject_id: row.subject_id || metadata.subject_id || targetSubjectId,
      semester: row.semester || metadata.semester,
      component_type: row.component_type || metadata.component_type,
      academic_year_id: academicYearId || row.academic_year_id || metadata.academic_year_id,
      points_earned: pointsEarned,
      score: normalizedScore,
      feedback: row.feedback ?? row.notes ?? null,
      graded_at: row.graded_at || metadata.graded_at,
      graded_by: user.id,
      deleted_at: null,
    };
  };

  if ('grades' in validatedData) {
    // Bulk insert
    const gradeRows = (validatedData.grades as any[]).map((g) =>
      normalizeRow(g, {
        class_id: validatedData.class_id,
        subject_id: validatedData.subject_id,
        component_type: validatedData.component_type,
        semester: validatedData.semester,
        assignment_id: validatedData.assignment_id,
        graded_at: validatedData.graded_at,
      })
    );

    if (targetAssignmentId) {
      const studentIds = gradeRows.map((grade) => grade.student_id);
      const { data: existingGrades, error: existingGradesError } = await supabase
        .from('grades')
        .select('id, student_id, deleted_at')
        .eq('assignment_id', targetAssignmentId)
        .in('student_id', studentIds);
      if (existingGradesError) {
        throw new Error(`Failed to resolve assignment grades: ${existingGradesError.message}`);
      }

      const existingByStudent = new Map<string, { id: string; deleted_at: string | null }>();
      for (const existing of existingGrades || []) {
        const selected = existingByStudent.get(existing.student_id);
        if (!selected || (selected.deleted_at && !existing.deleted_at)) {
          existingByStudent.set(existing.student_id, existing);
        }
      }
      const assignmentRows = gradeRows.map((grade) => {
        const existing = existingByStudent.get(grade.student_id);
        return existing ? { ...grade, id: existing.id } : grade;
      });

      const { data: insertedData, error } = await supabase
        .from('grades')
        .upsert(assignmentRows, { onConflict: 'id' })
        .select();
      if (error) {
        logger.error('Bulk assignment grade save failed:', error);
        throw new Error(`Failed to create grades: ${error.message}`);
      }

      return apiSuccess(insertedData, { _status: 201 });
    }

    const { data: insertedData, error } = await supabase
      .from('grades')
      .upsert(gradeRows, { onConflict: 'student_id,class_id,subject_id,component_type,semester' })
      .select();

    if (error) {
      logger.error('Bulk grade insert failed:', error);
      throw new Error(`Failed to create grades: ${error.message}`);
    }

    return apiSuccess(insertedData, { _status: 201 });
  } else {
    // Single insert
    const gradeRow = normalizeRow(validatedData);
    if (targetAssignmentId) {
      const { data: existingGrade, error: existingGradeError } = await supabase
        .from('grades')
        .select('id, deleted_at')
        .eq('assignment_id', targetAssignmentId)
        .eq('student_id', gradeRow.student_id)
        .order('deleted_at', { ascending: true, nullsFirst: true })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existingGradeError) {
        throw new Error(`Failed to resolve assignment grade: ${existingGradeError.message}`);
      }

      const assignmentGradeRow = existingGrade?.id
        ? { ...gradeRow, id: existingGrade.id }
        : gradeRow;
      const { data: insertedData, error } = await supabase
        .from('grades')
        .upsert(assignmentGradeRow, { onConflict: 'id' })
        .select()
        .single();
      if (error) {
        logger.error('Assignment grade save failed:', error);
        throw new Error(`Failed to create grade: ${error.message}`);
      }

      return apiSuccess(insertedData, { _status: 201 });
    }

    const { data: insertedData, error } = await supabase
      .from('grades')
      .upsert(gradeRow, { onConflict: 'student_id,class_id,subject_id,component_type,semester' })
      .select()
      .single();

    if (error) {
      logger.error('Grade insert failed:', error);
      throw new Error(`Failed to create grade: ${error.message}`);
    }

    return apiSuccess(insertedData, { _status: 201 });
  }
});
