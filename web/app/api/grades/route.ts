/**
 * Grades API (REFACTORED)
 *
 * Manages student grades for assignments using the unified API handler.
 * GET/POST /api/grades
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { logger } from '@/lib/logger';
import { bulkGradeEntrySchema, createGradeSchema, gradeQuerySchema } from '@/lib/schemas';
import { validateQuery } from '@/lib/api/validation';

// GET /api/grades
export const GET = createGetHandler({ permission: 'grades.view' }, async ({ request, user }) => {
  // Validate query parameters
  const queryParams = validateQuery(request, gradeQuerySchema);
  const supabase = createServiceClient();

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
      return apiSuccess([]);
    }

    if (queryParams.student_id) {
      // If parent requested a specific student, verify they are linked
      if (!linkedStudentIds.includes(queryParams.student_id)) {
        return apiSuccess([]);
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
  if (user.role === 'teacher') {
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('id')
      .eq('teacher_id', user.id);

    if (teacherClasses && teacherClasses.length > 0) {
      teacherClassIds = teacherClasses.map((c) => c.id);
    }
    // Note: If teacher has no classes, teacherClassIds remains null.
    // They won't be scoped to any classes, but can still see specific students if permitted by RLS/Permissions.
  }

  // Build query
  let query = supabase.from('grades').select(`
    *,
    subject:subjects(id, name, code),
    academic_year:academic_years(id, name)
  `);

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
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        queryParams.student_id
      );
      if (isUUID) {
        query = query.eq('student_id', queryParams.student_id);
      } else {
        const { data: st } = await supabase
          .from('profiles')
          .select('id')
          .or(
            `student_code.ilike.${queryParams.student_id},student_id.ilike.${queryParams.student_id},phone.eq.${queryParams.student_id}`
          )
          .maybeSingle();
        if (st) {
          query = query.eq('student_id', st.id);
        } else {
          return apiSuccess([]);
        }
      }
    }
  }

  // Teacher scoping: Relax scoping for single student history (Transcripts)
  if (teacherClassIds && !queryParams.student_id) {
    query = query.in('class_id', teacherClassIds);
  }

  const { data: grades, error } = await query;

  if (error) {
    logger.error('Failed to fetch grades:', error);
    throw new Error(`Database error: ${error.message}`);
  }

  return apiSuccess(grades || []);
});

// POST /api/grades
export const POST = createApiHandler({ permission: 'grades.manage' }, async ({ request }) => {
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

  const normalizeRow = (row: any, metadata: any = {}) => {
    const pointsEarned = row.points_earned ?? row.score ?? null;

    return {
      student_id: row.student_id,
      class_id: row.class_id || metadata.class_id,
      subject_id: row.subject_id || metadata.subject_id,
      semester: row.semester || metadata.semester,
      component_type: row.component_type || metadata.component_type,
      academic_year_id: academicYearId || row.academic_year_id || metadata.academic_year_id,
      points_earned: pointsEarned,
      score: pointsEarned, // Ensure score matches points_earned for compatibility
      feedback: row.feedback ?? row.notes ?? null,
      graded_at: row.graded_at || metadata.graded_at,
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
