/**
 * Admin Enrollments API
 * GET/POST /api/admin/enrollments
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { adminAuth } from "@/lib/auth/adminAuth";
import { handleApiError, AuthenticationError, ValidationError, ConflictError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

    const supabase = createServiceClient();
    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get("student_id");
    const classId = searchParams.get("class_id");
    const status = searchParams.get("status");

    // First, get enrollment records
    let query = supabase
      .from("enrollments")
      .select("*")
      .order("enrollment_date", { ascending: false });

    if (studentId) query = query.eq("student_id", studentId);
    if (classId) query = query.eq("class_id", classId);
    if (status) query = query.eq("status", status);

    const { data: enrollmentData, error: enrollmentError } = await query;
    if (enrollmentError) {
      logger.error("Enrollments fetch error:", { error: enrollmentError });
      throw new Error(`Database error: ${enrollmentError.message}`);
    }

    if (!enrollmentData || enrollmentData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Get unique student and class IDs
    const studentIds = [...new Set(enrollmentData.map(e => e.student_id))];
    const classIds = [...new Set(enrollmentData.map(e => e.class_id))];

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
    const enrichedData = enrollmentData.map(enrollment => ({
      ...enrollment,
      student: studentMap.get(enrollment.student_id) || null,
      class: classMap.get(enrollment.class_id) || null,
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

    const supabase = createServiceClient();
    const body = await request.json();
    const { student_id, class_id, status = "active" } = body;

    if (!student_id || !class_id) {
      throw new ValidationError("Student ID and Class ID are required");
    }

    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", student_id)
      .eq("class_id", class_id)
      .single();

    if (existing) {
      throw new ConflictError("Student is already enrolled in this class");
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id,
        class_id,
        status,
        enrollment_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      logger.error("Create enrollment error:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
