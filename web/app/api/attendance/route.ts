/**
 * Attendance API (REFACTORED)
 * GET /api/attendance - Fetch attendance records with role-based filtering
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { apiSuccess, createGetHandler } from "@/lib/api";
import { hasPermission } from "@/lib/auth/core";
import { logger } from "@/lib/logger";

export const GET = createGetHandler(
  { permission: "attendance.view" },
  async ({ user, searchParams }) => {
    const supabase = createServiceClient();

    // Build base query
    let query = supabase
      .from("attendance")
      .select(`id, class_id, student_id, date, status, remarks`)
      .order("date", { ascending: false });

    // --- Role-based Visibility Logic ---

    // 1. Staff and Higher (Admins, Super Admins) see all attendance
    const canViewAll = hasPermission(user.role as any, "attendance.manage");

    if (canViewAll) {
      // No filter needed
    } else if (user.role === "teacher") {
      // Teacher sees own classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", user.id);

      const classIds = classes?.map((c) => c.id) || [];
      if (classIds.length === 0) {
        return apiSuccess([]);
      }
      query = query.in("class_id", classIds);
    } else if (user.role === "student") {
      // Student sees own attendance
      query = query.eq("student_id", user.id);
    } else {
      return apiSuccess([]);
    }

    // Apply basic filters from query params
    const qClassId = searchParams.get("classId");
    if (qClassId) query = query.eq("class_id", qClassId);

    const qStudentId = searchParams.get("studentId");
    if (qStudentId) query = query.eq("student_id", qStudentId);

    const qDate = searchParams.get("date");
    if (qDate) query = query.eq("date", qDate);

    const { data, error } = await query;

    if (error) {
      logger.error("[API] Attendance query error:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return apiSuccess([]);
    }

    // Batch fetch student/class metadata for transformation
    const classIds = Array.from(
      new Set(data.map((r: any) => r.class_id).filter(Boolean)),
    );
    const studentIds = Array.from(
      new Set(data.map((r: any) => r.student_id).filter(Boolean)),
    );

    const classesMap: Record<string, any> = {};
    if (classIds.length > 0) {
      const { data: classesData } = await supabase
        .from("classes")
        .select("id, name")
        .in("id", classIds as string[]);

      if (classesData) {
        classesData.forEach((c: any) => {
          classesMap[c.id] = c;
        });
      }
    }

    const profilesMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds as string[]);

      if (profilesData) {
        profilesData.forEach((p: any) => {
          profilesMap[p.id] = p;
        });
      }
    }

    // Transform data
    const attendance = data.map((record: any) => ({
      id: record.id,
      class_id: record.class_id,
      student_id: record.student_id,
      date: record.date,
      status: record.status,
      remarks: record.remarks,
      student_name: profilesMap[record.student_id]?.full_name || "Unknown",
      class_name: classesMap[record.class_id]?.name || "Unknown",
    }));

    return apiSuccess(attendance);
  },
);
