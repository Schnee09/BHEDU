/**
 * Dashboard Statistics API
 * GET /api/dashboard/stats
 *
 * Returns aggregate statistics for the dashboard
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/core";
import { apiSuccess } from "@/lib/api";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { profile, role, authorized } = await getAuthContext(request);

    if (!authorized || !profile || !role) {
      console.error("[stats API] Auth failed or role missing");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const canSeeAll = hasPermission(role, "reports.view") ||
      hasPermission(role, "classes.manage");

    try {
      const today = new Date().toISOString().split("T")[0];

      // Execute all count queries in parallel
      const [
        studentsResult,
        teachersResult,
        classesResult,
        assignmentsResult,
        attendanceResult,
      ] = await Promise.all([
        // Count total students
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "student"),

        // Count total teachers
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "teacher"),

        // Count classes
        canSeeAll
          ? supabase.from("classes").select("id", {
            count: "exact",
            head: true,
          })
          : supabase.from("classes").select("id", {
            count: "exact",
            head: true,
          }).eq("teacher_id", profile.id),

        // Count assignments
        canSeeAll
          ? supabase.from("assignments").select("id", {
            count: "exact",
            head: true,
          })
          : (async () => {
            const { data: userClasses } = await supabase
              .from("classes")
              .select("id")
              .eq("teacher_id", profile.id);

            const classIds = userClasses?.map((c) => c.id) || [];
            if (classIds.length === 0) {
              return { count: 0, error: null };
            }

            return supabase
              .from("assignments")
              .select("id", { count: "exact", head: true })
              .in("class_id", classIds);
          })(),

        // Count today's attendance
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("date", today),
      ]);

      const stats = {
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalAssignments: assignmentsResult.count || 0,
        attendanceToday: attendanceResult.count || 0,
      };

      logger.info("Dashboard stats retrieved", {
        user_id: profile.id,
        role: role,
        stats,
      });

      return apiSuccess(stats);
    } catch (error: any) {
      logger.error("Error fetching dashboard stats:", error);
      return NextResponse.json({ error: "Error fetching statistics" }, {
        status: 500,
      });
    }
  } catch (error: any) {
    logger.error("Error in GET /api/dashboard/stats:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}
