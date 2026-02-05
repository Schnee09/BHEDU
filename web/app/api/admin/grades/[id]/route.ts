/**
 * Admin Individual Grade API (REFACTORED)
 * GET /api/admin/grades/[id] - Get grade details with history
 * PATCH /api/admin/grades/[id] - Update/override grade with audit
 * DELETE /api/admin/grades/[id] - Delete grade
 */

import { NextResponse } from "next/server";
import { getDataClient } from "@/lib/auth/dataClient";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { updateGradeSchema } from "@/lib/schemas";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

// GET /api/admin/grades/[id]
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ params, request }) => {
    const { supabase } = await getDataClient(request);

    const { data: grade, error } = await supabase
      .from("grades")
      .select(`
        *,
        assignment:assignments!grades_assignment_id_fkey(
          id,
          title,
          description,
          total_points,
          type,
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
      `)
      .eq("id", params.id)
      .single();

    if (error || !grade) {
      throw new NotFoundError("Grade not found");
    }

    // Calculate percentage and letter grade if points are available
    let percentage = null;
    let calculatedLetterGrade = null;

    if (grade.points_earned !== null && grade.assignment?.total_points) {
      percentage = (grade.points_earned / grade.assignment.total_points) * 100;

      if (percentage >= 90) calculatedLetterGrade = "A";
      else if (percentage >= 80) calculatedLetterGrade = "B";
      else if (percentage >= 70) calculatedLetterGrade = "C";
      else if (percentage >= 60) calculatedLetterGrade = "D";
      else calculatedLetterGrade = "F";
    }

    return apiSuccess({
      ...grade,
      percentage,
      calculated_letter_grade: calculatedLetterGrade,
    });
  },
);

// PATCH /api/admin/grades/[id]
export const PATCH = createApiHandler(
  {
    allowedRoles: ["admin", "staff"],
    bodySchema: updateGradeSchema,
  },
  async ({ params, body, request, user }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Verify grade exists
    const { data: existingGrade, error: fetchError } = await supabase
      .from("grades")
      .select(`
        *,
        assignment:assignments!grades_assignment_id_fkey(
          id,
          total_points
        )
      `)
      .eq("id", id)
      .single();

    if (fetchError || !existingGrade) {
      throw new NotFoundError("Grade not found");
    }

    // Business Logic: Validate points if being updated
    if (body.points_earned !== undefined && body.points_earned !== null) {
      const totalPoints = existingGrade.assignment?.total_points;
      if (!totalPoints) {
        throw new ValidationError("Assignment total_points not found");
      }
      if (body.points_earned < 0 || body.points_earned > totalPoints) {
        throw new ValidationError(
          `Points must be between 0 and ${totalPoints}`,
        );
      }
    }

    // Add metadata for grading
    const updates = {
      ...body,
      updated_at: new Date().toISOString(),
      graded_at: (body.points_earned !== undefined ||
          (body as any).letter_grade !== undefined)
        ? new Date().toISOString()
        : undefined,
    };

    // Update grade
    const { data: updatedGrade, error: updateError } = await supabase
      .from("grades")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating grade:", updateError);
      throw new Error(`Failed to update grade: ${updateError.message}`);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      actor_id: user.id, // Fixed: should be user.id matching audit_logs schema or common practice
      action: "grade_override",
      resource_type: "grade",
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
        reason: (body as any).reason || "Admin override",
      },
    });

    return apiSuccess(updatedGrade, { message: "Grade updated successfully" });
  },
);

// DELETE /api/admin/grades/[id]
export const DELETE = createGetHandler(
  { allowedRoles: ["admin"] },
  async ({ params, request }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Check if grade exists
    const { data: grade, error: fetchError } = await supabase
      .from("grades")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !grade) {
      throw new NotFoundError("Grade not found");
    }

    // Delete the grade
    const { error: deleteError } = await supabase
      .from("grades")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error("Error deleting grade:", deleteError);
      throw new Error(`Failed to delete grade: ${deleteError.message}`);
    }

    return apiSuccess(null, { message: "Grade deleted successfully" });
  },
);
