/**
 * Admin Attendance API
 * GET/POST /api/admin/attendance
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth } from "@/lib/auth/adminAuth";
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

  const { supabase } = await getDataClient(request);
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("student_id");
    const classId = searchParams.get("class_id");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    // First, get attendance records
    let query = supabase
      .from("attendance")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (classId) query = query.eq("class_id", classId);
    if (date) query = query.eq("date", date);
    if (status) query = query.eq("status", status);

    const { data: attendanceData, error: attendanceError } = await query;
    if (attendanceError) {
      logger.error("Attendance fetch error:", { error: attendanceError });
      throw new Error(`Database error: ${attendanceError.message}`);
    }

    if (!attendanceData || attendanceData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Get unique student and class IDs
    const studentIds = [...new Set(attendanceData.map(a => a.student_id))];
    const classIds = [...new Set(attendanceData.map(a => a.class_id))];

    // Fetch students
    const { data: students } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);

    // Fetch classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .in("id", classIds);

    // Create lookup maps
    const studentMap = new Map(students?.map(s => [s.id, s]) || []);
    const classMap = new Map(classes?.map(c => [c.id, c]) || []);

    // Combine data
    const enrichedData = attendanceData.map(attendance => ({
      ...attendance,
      student: studentMap.get(attendance.student_id) || null,
      class: classMap.get(attendance.class_id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedData,
      total: enrichedData.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

  const { supabase } = await getDataClient(request);
    const body = await request.json();
    const { student_id, class_id, date, status, check_in_time, check_out_time, notes, marked_by } = body;

    if (!student_id || !class_id || !date || !status) {
      throw new ValidationError("Student ID, Class ID, date, and status are required");
    }

    // Check if record exists for this student/class/date
    const { data: existing } = await supabase
      .from("attendance")
      .select("id")
      .eq("student_id", student_id)
      .eq("class_id", class_id)
      .eq("date", date)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from("attendance")
        .update({ status, check_in_time, check_out_time, notes, marked_by })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        logger.error("Update attendance error:", { error });
        throw new Error(`Database error: ${error.message}`);
      }
      return NextResponse.json({ success: true, data });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("attendance")
        .insert({
          student_id,
          class_id,
          date,
          status,
          check_in_time,
          check_out_time,
          notes,
          marked_by,
        })
        .select()
        .single();

      if (error) {
        logger.error("Create attendance error:", { error });
        throw new Error(`Database error: ${error.message}`);
      }
      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
