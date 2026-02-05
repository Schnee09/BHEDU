/**
 * Role-aware Student Detail API (REFACTORED)
 * GET/PUT/DELETE /api/students/[id]
 */

import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import {
  DELETE as adminDELETE,
  GET as adminGET,
  PUT as adminPUT,
} from "@/app/api/admin/students/[id]/route";
import { AuthorizationError, NotFoundError } from "@/lib/api/errors";
import { getDataClient } from "@/lib/auth/dataClient";

// GET /api/students/[id]
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff", "teacher"] },
  async ({ params, request, user }) => {
    // 1. Admin/Staff bypass to admin handler
    if (user.role === "admin" || user.role === "staff") {
      return adminGET(request, { params: Promise.resolve(params) });
    }

    // 2. Teacher logic
    const { supabase } = await getDataClient(request);

    // Find teacher profile id
    const { data: teacherProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!teacherProfile) {
      throw new AuthorizationError("Teacher profile not found");
    }

    // Verify student is in one of teacher's classes via enrollment
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_id", params.id)
      .eq("status", "active")
      .maybeSingle();

    if (!enrollment) {
      throw new NotFoundError("Student not found or not enrolled");
    }

    const { data: teacherClass } = await supabase
      .from("classes")
      .select("id")
      .eq("id", enrollment.class_id)
      .eq("teacher_id", teacherProfile.id)
      .maybeSingle();

    if (!teacherClass) {
      throw new AuthorizationError(
        "Bạn không có quyền xem thông tin học sinh này",
      );
    }

    // Fetch student data
    const { data: student } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .eq("role", "student")
      .maybeSingle();

    if (!student) {
      throw new NotFoundError("Student not found");
    }

    return apiSuccess(student);
  },
);

// Admin-only operations via delegation
export const PUT = createApiHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ params, request }) => {
    return adminPUT(request, { params: Promise.resolve(params) });
  },
);

export const DELETE = createGetHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ params, request }) => {
    return adminDELETE(request, { params: Promise.resolve(params) });
  },
);
