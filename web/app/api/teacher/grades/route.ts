/**
 * Teacher Grades API (Vietnamese Education System)
 * GET /api/teacher/grades - Get grades for teacher's classes
 * POST /api/teacher/grades - Enter/update grades with full metadata
 *
 * Teachers can only manage grades for their own classes
 *
 * Required fields for POST:
 * - student_id: UUID of the student
 * - class_id: UUID of the class
 * - subject_id: UUID of the subject
 * - component_type: Grade component (oral, fifteen_min, one_period, midterm, final)
 * - semester: Semester identifier ("1" or "2")
 * - score: Numeric score (0-10)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { teacherAuth } from "@/lib/auth/adminAuth";
import {
  AuthenticationError,
  ForbiddenError,
  handleApiError,
  ValidationError,
} from "@/lib/api/errors";
import { logger } from "@/lib/logger";

const VALID_COMPONENT_TYPES = [
  "oral",
  "fifteen_min",
  "one_period",
  "midterm",
  "final",
];
const VALID_SEMESTERS = ["1", "2"];

export async function GET(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

    if (authResult.userRole !== "teacher") {
      throw new ForbiddenError("This endpoint is for teachers only");
    }

    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("class_id");
    const subjectId = searchParams.get("subject_id");
    const studentId = searchParams.get("student_id");
    const semester = searchParams.get("semester");
    const componentType = searchParams.get("component_type");

    // Get teacher's class IDs
    const { data: teacherClasses } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", authResult.userId);

    const classIds = teacherClasses?.map((c) => c.id) || [];

    if (classIds.length === 0) {
      return NextResponse.json({
        success: true,
        grades: [],
        message: "No classes assigned",
      });
    }

    // Build query using new schema (no assignments table)
    let query = supabase
      .from("grades")
      .select(`
        id,
        score,
        points_earned,
        component_type,
        semester,
        graded_at,
        feedback,
        student_id,
        class_id,
        subject_id,
        student:profiles!grades_student_id_fkey(id, full_name, email, student_code),
        class:classes!grades_class_id_fkey(id, name),
        subject:subjects!grades_subject_id_fkey(id, name, code)
      `)
      .in("class_id", classIds);

    if (classId && classIds.includes(classId)) {
      query = query.eq("class_id", classId);
    }

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    if (semester) {
      query = query.eq("semester", semester);
    }

    if (componentType) {
      query = query.eq("component_type", componentType);
    }

    const { data, error } = await query
      .order("graded_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.error("Failed to fetch grades:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      grades: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

    if (authResult.userRole !== "teacher") {
      throw new ForbiddenError("This endpoint is for teachers only");
    }

    const supabase = createServiceClient();
    const body = await request.json();

    // Support both single and bulk grade entry
    const grades = Array.isArray(body) ? body : [body];

    if (grades.length === 0) {
      throw new ValidationError("At least one grade is required");
    }

    // Get teacher's class IDs for validation
    const { data: teacherClasses } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", authResult.userId);

    const classIds = new Set(teacherClasses?.map((c) => c.id) || []);

    // Validate and prepare grades
    const validatedGrades = [];

    for (const grade of grades) {
      const {
        student_id,
        class_id,
        subject_id,
        component_type,
        semester,
        score,
        feedback,
      } = grade;

      // Validate required fields
      if (
        !student_id || !class_id || !subject_id || !component_type ||
        !semester || score === undefined
      ) {
        throw new ValidationError(
          "student_id, class_id, subject_id, component_type, semester, and score are required",
        );
      }

      // Validate class belongs to teacher
      if (!classIds.has(class_id)) {
        throw new ForbiddenError(`You do not have access to class ${class_id}`);
      }

      // Validate component_type
      if (!VALID_COMPONENT_TYPES.includes(component_type)) {
        throw new ValidationError(
          `Invalid component_type. Must be one of: ${
            VALID_COMPONENT_TYPES.join(", ")
          }`,
        );
      }

      // Validate semester
      if (!VALID_SEMESTERS.includes(semester)) {
        throw new ValidationError(
          `Invalid semester. Must be one of: ${VALID_SEMESTERS.join(", ")}`,
        );
      }

      // Validate score (Vietnamese 0-10 scale)
      if (score < 0 || score > 10) {
        throw new ValidationError("Score must be between 0 and 10");
      }

      validatedGrades.push({
        student_id,
        class_id,
        subject_id,
        component_type,
        semester,
        score,
        points_earned: score,
        feedback: feedback || null,
        graded_at: new Date().toISOString(),
        graded_by: authResult.userId,
      });
    }

    // Upsert grades using the correct unique constraint
    const { data, error } = await supabase
      .from("grades")
      .upsert(validatedGrades, {
        onConflict: "student_id,class_id,subject_id,component_type,semester",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      logger.error("Failed to save grades:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${validatedGrades.length} grade(s)`,
      grades: data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
