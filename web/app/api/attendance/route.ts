/**
 * Attendance API
 * GET /api/attendance - Fetch attendance records
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { teacherAuth } from "@/lib/auth/adminAuth";
import { hasAdminAccess } from "@/lib/auth/permissions";
import { handleApiError, AuthenticationError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    // Use standardized auth
    const authResult = await teacherAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

    const supabase = createServiceClient();

    // Build base query
    let query = supabase
      .from("attendance")
      .select(`id, class_id, student_id, date, status`)
      .order("date", { ascending: false });

    const userRole = authResult.userRole || '';
    
    if (hasAdminAccess(userRole)) {
      // Admin and Staff see all
    } else if (userRole === "teacher") {
      // Teacher sees own classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", authResult.userId);

      const classIds = classes?.map((c) => c.id) || [];
      if (classIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      query = query.in("class_id", classIds);
    } else if (userRole === "student") {
      // Student sees own attendance
      query = query.eq("student_id", authResult.userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("[API] Attendance query error:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    // If no attendance records, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Batch fetch profile names and class names to avoid ambiguous embedded relationships
    const classIds = Array.from(new Set((data || []).map((r: any) => r.class_id).filter(Boolean)));
    const studentIds = Array.from(new Set((data || []).map((r: any) => r.student_id).filter(Boolean)));

    const classesMap: Record<string, any> = {};
    if (classIds.length > 0) {
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds as string[]);
      
      if (classesError) {
        console.error("[API] Classes fetch error:", classesError);
        // Continue with empty map rather than failing
      } else if (classesData) {
        classesData.forEach((c: any) => { classesMap[c.id] = c; });
      }
    }

    const profilesMap: Record<string, any> = {};
    if (studentIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds as string[]);
      
      if (profilesError) {
        console.error("[API] Profiles fetch error:", profilesError);
        // Continue with empty map rather than failing
      } else if (profilesData) {
        profilesData.forEach((p: any) => { profilesMap[p.id] = p; });
      }
    }

    // Transform data
    const attendance = (data || []).map((record: any) => ({
      id: record.id,
      class_id: record.class_id,
      student_id: record.student_id,
      date: record.date,
      status: record.status,
      student_name: profilesMap[record.student_id]?.full_name || 'Unknown',
      class_name: classesMap[record.class_id]?.name || 'Unknown'
    }));

    return NextResponse.json({ success: true, data: attendance });
  } catch (error) {
    return handleApiError(error);
  }
}
