/**
 * Classes API
 * GET /api/classes - Fetch classes
 * POST /api/classes - Create a new class
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/core";
import {
  AuthenticationError,
  handleApiError,
  ValidationError,
} from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import { ClassService } from "@/lib/services/classService";
import { createClassSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const { user, profile, role, authorized } = await getAuthContext(
      request,
      "classes.view",
    );

    if (!authorized || !profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, {
        status: 401,
      });
    }

    const supabase = createServiceClient();
    const profileId = profile.id;

    // --- Role-based Visibility Logic ---

    if (!role) {
      throw new AuthenticationError("User role not found");
    }

    // 1. Staff and Higher see all classes
    if (hasPermission(role, "classes.manage")) {
      const { data: classes, error } = await supabase
        .from("classes")
        .select(`
          id, name, teacher_id, course_id, created_at,
          teacher:profiles!classes_teacher_id_fkey (
            id,
            full_name,
            email,
            teacher_subjects (
              subject_id,
              is_primary,
              subjects (
                id,
                name,
                code
              )
            )
          ),
          course:courses (
            id,
            name,
            code
          )
        `)
        .order("name", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, classes: classes || [] });
    }

    // 2. Teachers see only their classes
    if (role === "teacher") {
      const { data: classes, error } = await supabase
        .from("classes")
        .select(`
          id, name, teacher_id, course_id, created_at,
          teacher:profiles!classes_teacher_id_fkey (
            id,
            full_name,
            email,
            subject_id,
            subjects (
              id,
              name,
              code
            )
          ),
          course:courses (
            id,
            name,
            code
          )
        `)
        .eq("teacher_id", profileId)
        .order("name", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, classes: classes || [] });
    }

    // 3. Students see only classes they're enrolled in
    if (role === "student") {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("class_id")
        .eq("student_id", profileId)
        .eq("status", "active");

      if (enrollError) throw enrollError;

      const classIds = (enrollments || []).map((e) => e.class_id);
      if (classIds.length === 0) {
        return NextResponse.json({ success: true, classes: [] });
      }

      const { data: classes, error } = await supabase
        .from("classes")
        .select(`
          id, name, teacher_id, course_id, created_at,
          teacher:profiles!classes_teacher_id_fkey (
            id,
            full_name,
            email,
            subject_id,
            subjects (
              id,
              name,
              code
            )
          ),
          course:courses (
            id,
            name,
            code
          )
        `)
        .in("id", classIds)
        .order("name", { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, classes: classes || [] });
    }

    return NextResponse.json({ success: true, classes: [] });
  } catch (error) {
    logger.error("Classes API error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, role, authorized } = await getAuthContext(
      request,
      "classes.manage",
    );

    if (!authorized) {
      throw new AuthenticationError("Unauthorized");
    }

    const body = await request.json();

    // Normalize body for validation
    const normalizedBody = {
      ...body,
      teacher_id: body.teacher_id || body.teacherId,
      academic_year_id: body.academic_year_id || body.academicYearId,
      max_capacity: body.max_capacity || body.maxCapacity,
      sessions_per_week: body.sessions_per_week || body.sessionsPerWeek,
      class_type: body.class_type || body.classType,
    };

    const validatedData = createClassSchema.safeParse(normalizedBody);
    if (!validatedData.success) {
      throw new ValidationError(validatedData.error.issues[0].message);
    }

    const newClass = await ClassService.createClass(validatedData.data);

    return NextResponse.json({ success: true, class: newClass }, {
      status: 201,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
