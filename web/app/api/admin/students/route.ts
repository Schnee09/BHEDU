/**
 * Students API (REFACTORED)
 * GET/POST /api/admin/students
 */

import { NextResponse } from "next/server";
import { getDataClient } from "@/lib/auth/dataClient";
import {
  apiPaginated,
  apiSuccess,
  createApiHandler,
  createGetHandler,
} from "@/lib/api";
import { createStudentSchema, studentQuerySchema } from "@/lib/schemas";
import { logger } from "@/lib/logger";
import { generateStudentCode } from "@/lib/students/studentCode";
import { validateQuery } from "@/lib/api/validation";

// GET /api/admin/students
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ request, searchParams }) => {
    const { supabase } = await getDataClient(request);
    const queryParams = validateQuery(request, studentQuerySchema);

    const search = queryParams.search || "";
    const classId = queryParams.class_id;
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 50;
    const offset = (page - 1) * limit;

    // Build base query
    let countQuery = supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student");

    let dataQuery = supabase
      .from("profiles")
      .select(`
        id, user_id, email, full_name, role, phone, address, 
        date_of_birth, student_code, grade_level, gender, 
        status, is_active, photo_url, enrollment_date, 
        notes, department, created_at, updated_at
      `)
      .eq("role", "student")
      .order("full_name", { ascending: true });

    // Apply search filter
    if (search) {
      const searchFilter =
        `full_name.ilike.%${search}%,email.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Class filter
    if (classId) {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", classId)
        .eq("status", "active");

      if (enrollError) throw enrollError;

      const studentIds = enrollments.map((e) => e.student_id);
      if (studentIds.length > 0) {
        countQuery = countQuery.in("id", studentIds);
        dataQuery = dataQuery.in("id", studentIds);
      } else {
        return apiPaginated([], { page, pageSize: limit, total: 0 });
      }
    }

    // Get total count
    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Get paginated data
    const { data, error } = await dataQuery.range(offset, offset + limit - 1);
    if (error) throw error;

    // Calculate statistics (conditionally)
    let statistics = null;
    if (!search && !classId && page === 1) {
      const { data: allStudents, error: statsError } = await supabase
        .from("profiles")
        .select("id, is_active, grade_level")
        .eq("role", "student");

      if (!statsError && allStudents) {
        const byGrade: Record<string, number> = {};
        let activeCount = 0;
        let inactiveCount = 0;

        allStudents.forEach((student) => {
          if (student.is_active !== false) activeCount++;
          else inactiveCount++;

          const gradeLevel = student.grade_level || "Chưa xác định";
          byGrade[gradeLevel] = (byGrade[gradeLevel] || 0) + 1;
        });

        statistics = {
          total_students: allStudents.length,
          active_students: activeCount,
          inactive_students: inactiveCount,
          by_grade: byGrade,
        };
      }
    }

    return apiPaginated(data || [], {
      page,
      pageSize: limit,
      total: count || 0,
    }, { statistics });
  },
);

// POST /api/admin/students
export const POST = createApiHandler(
  {
    allowedRoles: ["admin", "staff"],
    bodySchema: createStudentSchema,
  },
  async ({ body }) => {
    const { UserService } = await import("@/lib/services/userService");
    const userService = new UserService();

    logger.info("Creating student via UserService", {
      email: body.email,
      full_name: body.full_name,
    });

    try {
      const result = await userService.createUser({
        ...body,
        role: "student",
      } as any, "admin");

      return apiSuccess(result, {
        message:
          `Student created successfully with code ${result.student_code}`,
        tempPassword: result.tempPassword,
        _status: 201,
      });
    } catch (err: any) {
      logger.error("Error creating student", err);
      return NextResponse.json({
        success: false,
        error: err.message || "Không thể tạo học sinh",
      }, { status: err.statusCode || 400 });
    }
  },
);
