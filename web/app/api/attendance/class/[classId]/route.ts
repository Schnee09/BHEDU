/**
 * Get Class Attendance API
 * GET /api/attendance/class/[classId]?date=YYYY-MM-DD
 *
 * Get attendance records for all students in a class on a specific date
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { teacherAuth } from "@/lib/auth/adminAuth";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> },
) {
  try {
    // Teacher or admin authentication
    const authResult = await teacherAuth(req);

    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.reason || "Unauthorized" },
        { status: 401 },
      );
    }

    const supabase = createServiceClient();
    const { classId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date") ||
      new Date().toISOString().split("T")[0];

    // Verify teacher has access to this class
    if (authResult.userRole !== "admin") {
      const { data: classData } = await supabase
        .from("classes")
        .select("id")
        .eq("id", classId)
        .eq("teacher_id", authResult.userId)
        .single();

      if (!classData) {
        return NextResponse.json(
          {
            error:
              "You do not have permission to view attendance for this class",
          },
          { status: 403 },
        );
      }
    }

    // Get class info
    const { data: classInfo, error: classError } = await supabase
      .from("classes")
      .select("id, name")
      .eq("id", classId)
      .single();

    if (classError || !classInfo) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 },
      );
    }

    // Get students enrolled in the class with joins
    // We use service client to ensure we can read profiles
    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select(`
        student_id,
        profiles!enrollments_student_id_fkey (
          id,
          full_name,
          email,
          student_id
        )
      `)
      .eq("class_id", classId);

    if (enrollError) {
      logger.error(
        "Failed to fetch enrollments",
        new Error(enrollError.message),
      );
      return NextResponse.json(
        {
          error: "Failed to fetch class enrollments",
          details: enrollError.message,
        },
        { status: 500 },
      );
    }

    // Get attendance records for this date
    const { data: attendance } = await supabase
      .from("attendance")
      .select("student_id, status, remarks")
      .eq("class_id", classId)
      .eq("date", date);

    // Combine enrollment and attendance data
    const attendanceMap = new Map(
      attendance?.map((a) => [a.student_id, a]) || [],
    );

    const records = (enrollments || []).map((enrollment: any) => ({
      studentId: enrollment.student_id,
      studentName: enrollment.profiles?.full_name || "Unknown",
      studentCode: enrollment.profiles?.student_id || "",
      email: enrollment.profiles?.email || "",
      status: attendanceMap.get(enrollment.student_id)?.status || "unmarked",
      remarks: (attendanceMap.get(enrollment.student_id) as any)?.remarks || "",
    }));

    // Calculate summary statistics
    const summary = {
      totalStudents: records.length,
      presentCount: records.filter((r) => r.status === "present").length,
      absentCount: records.filter((r) => r.status === "absent").length,
      unmarkedCount: records.filter((r) => r.status === "unmarked").length,
      attendanceRate: 0,
    };

    summary.attendanceRate = summary.totalStudents > 0
      ? Math.round((summary.presentCount / summary.totalStudents) * 100 * 100) /
        100
      : 0;

    return NextResponse.json({
      success: true,
      class: classInfo,
      date,
      summary,
      students: records,
    });
  } catch (error) {
    logger.error("Get class attendance error", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
