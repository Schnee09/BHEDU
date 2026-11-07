/**
 * Admin Individual Grade API (REFACTORED)
 * GET /api/admin/grades/[id] - Get grade details with history
 * PATCH /api/admin/grades/[id] - Update/override grade with audit
 * DELETE /api/admin/grades/[id] - Delete grade
 */

import { getDataClient } from '@/lib/auth/dataClient';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { updateGradeSchema } from '@/lib/schemas';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logger';

// GET /api/admin/grades/[id]
export const GET = createGetHandler({ allowedRoles: ['admin'] }, async ({ params, request }) => {
  const { supabase } = await getDataClient(request);

  const { data: grade, error } = await supabase
    .from('grades')
    .select(
      `
        *,
        assignment:assignments!grades_assignment_id_fkey(
          id,
          title,
          description,
          total_points:max_points,
          due_date,
          published,
          class:classes!assignments_class_id_fkey(
            id,
            name,
            code,
            grade_level,
            teacher:profiles!classes_teacher_id_fkey(
              id,
              first_name,
              last_name,
              email
            ),
            academic_year:academic_years(
              id,
              name,
              start_date,
              end_date
            )
          ),
          category:assignment_categories(
            id,
            name,
            weight
          )
        ),
        student:profiles!grades_student_id_fkey(
          id,
          full_name,
          email,
          date_of_birth,
          phone
        )
      `
    )
    .eq('id', params.id)
    .is('deleted_at', null)
    .single();

  if (error || !grade) {
    throw new NotFoundError('Grade not found');
  }

  // Calculate percentage and letter grade if points are available
  let percentage = null;
  let calculatedLetterGrade = null;

  if (grade.points_earned !== null && grade.assignment?.total_points) {
    percentage = (grade.points_earned / grade.assignment.total_points) * 100;

    if (percentage >= 90) calculatedLetterGrade = 'A';
    else if (percentage >= 80) calculatedLetterGrade = 'B';
    else if (percentage >= 70) calculatedLetterGrade = 'C';
    else if (percentage >= 60) calculatedLetterGrade = 'D';
    else calculatedLetterGrade = 'F';
  }

  return apiSuccess({
    ...grade,
    percentage,
    calculated_letter_grade: calculatedLetterGrade,
  });
});

// PATCH /api/admin/grades/[id]
export const PATCH = createApiHandler(
  {
    allowedRoles: ['admin'],
    bodySchema: updateGradeSchema,
  },
  async ({ params, body, request, user }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Verify grade exists
    const { data: existingGrade, error: fetchError } = await supabase
      .from('grades')
      .select(
        `
        *,
        assignment:assignments!grades_assignment_id_fkey(
          id,
          total_points:max_points
        )
      `
      )
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingGrade) {
      throw new NotFoundError('Grade not found');
    }

    const { reason, notes, feedback, points_earned, score, graded_at } = body;
    const hasScoreUpdate = points_earned !== undefined || score !== undefined;
    let normalizedScore = score;
    let normalizedPoints = points_earned;

    if (hasScoreUpdate) {
      if (existingGrade.assignment_id) {
        const totalPoints = Number(existingGrade.assignment?.total_points);
        if (!Number.isFinite(totalPoints) || totalPoints <= 0) {
          throw new ValidationError('Assignment point scale not found');
        }
        if (points_earned !== undefined) {
          if (points_earned !== null && points_earned > totalPoints) {
            throw new ValidationError(`Points must be between 0 and ${totalPoints}`);
          }
          normalizedScore =
            points_earned === null
              ? null
              : Math.round(((points_earned / totalPoints) * 10 + Number.EPSILON) * 100) / 100;
        } else if (score !== undefined) {
          normalizedPoints =
            score === null
              ? null
              : Math.round(((score / 10) * totalPoints + Number.EPSILON) * 100) / 100;
        }
      } else {
        const traditionalValue = points_earned !== undefined ? points_earned : score;
        if (traditionalValue !== null && traditionalValue !== undefined && traditionalValue > 10) {
          throw new ValidationError('Points must be between 0 and 10');
        }
        normalizedScore = traditionalValue;
        normalizedPoints = traditionalValue;
      }
    }

    // Only persist columns that exist in the grades table. Audit-only fields
    // such as reason must never be spread into the database update payload.
    const updates = {
      ...(normalizedPoints !== undefined ? { points_earned: normalizedPoints } : {}),
      ...(normalizedScore !== undefined ? { score: normalizedScore } : {}),
      ...(feedback !== undefined || notes !== undefined
        ? { feedback: feedback ?? notes ?? null }
        : {}),
      updated_at: new Date().toISOString(),
      ...(graded_at !== undefined
        ? { graded_at }
        : hasScoreUpdate
          ? { graded_at: new Date().toISOString() }
          : {}),
    };

    // Update grade
    const { data: updatedGrade, error: updateError } = await supabase
      .from('grades')
      .update(updates)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating grade:', updateError);
      throw new Error(`Failed to update grade: ${updateError.message}`);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id, // Fixed: should be user.id matching audit_logs schema or common practice
      action: 'grade_override',
      resource_type: 'grade',
      resource_id: id,
      old_data: {
        points_earned: existingGrade.points_earned,
        letter_grade: (existingGrade as any).letter_grade,
        feedback: (existingGrade as any).feedback,
      },
      new_data: {
        points_earned: updatedGrade.points_earned,
        letter_grade: (updatedGrade as any).letter_grade,
        feedback: (updatedGrade as any).feedback,
      },
      metadata: {
        student_id: existingGrade.student_id,
        assignment_id: existingGrade.assignment_id,
        reason: reason || 'Admin override',
      },
    });

    return apiSuccess(updatedGrade, { message: 'Grade updated successfully' });
  }
);

// DELETE /api/admin/grades/[id]
export const DELETE = createGetHandler(
  { allowedRoles: ['admin'] },
  async ({ params, request, user }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Check if grade exists
    const { data: grade, error: fetchError } = await supabase
      .from('grades')
      .select('id, student_id, class_id, subject_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !grade) {
      throw new NotFoundError('Grade not found');
    }

    const deletedAt = new Date().toISOString();
    const { error: deleteError } = await supabase
      .from('grades')
      .update({ deleted_at: deletedAt, updated_at: deletedAt })
      .eq('id', id)
      .is('deleted_at', null);

    if (deleteError) {
      logger.error('Error deleting grade:', deleteError);
      throw new Error(`Failed to delete grade: ${deleteError.message}`);
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'grade_delete',
      resource_type: 'grade',
      resource_id: id,
      old_data: grade,
      new_data: { deleted_at: deletedAt },
    });

    return apiSuccess(null, { message: 'Grade deleted successfully' });
  }
);
