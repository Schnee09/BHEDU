/**
 * Grades API (REFACTORED)
 *
 * Manages student grades for assignments using the unified API handler.
 * GET/POST /api/grades
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { logger } from "@/lib/logger";
import {
  bulkGradeEntrySchema,
  createGradeSchema,
  gradeQuerySchema,
} from "@/lib/schemas/grades";
import { validateQuery } from "@/lib/api/validation";

// GET /api/grades
export const GET = createGetHandler(
  { permission: "grades.view" },
  async ({ request, user }) => {
    // Validate query parameters
    const queryParams = validateQuery(request, gradeQuerySchema);
    const supabase = createServiceClient();

    // ========== TEACHER SCOPE FILTER ==========
    let teacherClassIds: string[] | null = null;
    if (user.role === "teacher") {
      const { data: teacherClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);

      if (teacherClasses && teacherClasses.length > 0) {
        teacherClassIds = teacherClasses.map((c) => c.id);
      } else {
        return apiSuccess([]);
      }
    }

    // Build query
    let query = supabase
      .from("grades")
      .select("*");

    if (queryParams.assignment_id) {
      query = query.eq("assignment_id", queryParams.assignment_id);
    }

    if (queryParams.student_id) {
      query = query.eq("student_id", queryParams.student_id);
    }

    // Teacher filtering logic
    if (teacherClassIds) {
      const { data: teacherAssignments } = await supabase
        .from("assignments")
        .select("id")
        .in("class_id", teacherClassIds);

      if (teacherAssignments && teacherAssignments.length > 0) {
        const assignmentIds = teacherAssignments.map((a) => a.id);
        query = query.in("assignment_id", assignmentIds);
      } else {
        return apiSuccess([]);
      }
    }

    const { data: grades, error } = await query;

    if (error) {
      logger.error("Failed to fetch grades:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    return apiSuccess(grades || []);
  },
);

// POST /api/grades
export const POST = createApiHandler(
  { permission: "grades.manage" },
  async ({ body }) => {
    const supabase = createServiceClient();
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
      return NextResponse.json({ success: false, error: e.message }, {
        status: 400,
      });
    }

    const normalizeRow = (row: any) => {
      const pointsEarned = row.points_earned ?? row.score ?? null;
      const missing = !!row.missing;
      const excused = !!row.excused;

      return {
        student_id: row.student_id,
        assignment_id: row.assignment_id,
        points_earned: missing || excused ? null : pointsEarned,
        late: !!row.late,
        excused,
        missing,
        feedback: row.feedback ?? row.notes ?? null,
        graded_at: row.graded_at,
      };
    };

    if ("grades" in validatedData) {
      // Bulk insert
      const gradeRows = (validatedData.grades as any[]).map((g) =>
        normalizeRow({
          ...g,
          assignment_id: validatedData.assignment_id,
          graded_at: validatedData.graded_at,
        })
      );

      const { data: insertedData, error } = await supabase
        .from("grades")
        .insert(gradeRows)
        .select();

      if (error) {
        logger.error("Bulk grade insert failed:", error);
        throw new Error(`Failed to create grades: ${error.message}`);
      }

      return apiSuccess(insertedData, { _status: 201 });
    } else {
      // Single insert
      const gradeRow = normalizeRow(validatedData);
      const { data: insertedData, error } = await supabase
        .from("grades")
        .insert(gradeRow)
        .select()
        .single();

      if (error) {
        logger.error("Grade insert failed:", error);
        throw new Error(`Failed to create grade: ${error.message}`);
      }

      return apiSuccess(insertedData, { _status: 201 });
    }
  },
);
