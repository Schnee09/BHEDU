/**
 * Admin Teachers API
 * GET/POST /api/admin/teachers
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from "@/lib/auth/dataClient";
import { adminAuth } from "@/lib/auth/adminAuth";
import {
  AuthenticationError,
  handleApiError,
  ValidationError,
} from "@/lib/api/errors";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/teachers
 * Fetch all teachers with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

    const { supabase } = await getDataClient(request);
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const includeStaff = searchParams.get("include_staff") !== "false"; // Default: include staff

    // Build query - include both teachers AND staff (who can also teach)
    const roles = includeStaff ? ["teacher", "staff"] : ["teacher"];

    let query = supabase
      .from("profiles")
      .select(
        "id, full_name, email, role, date_of_birth, phone, address, created_at",
      )
      .in("role", roles)
      .order("role", { ascending: true }) // Staff first, then teachers
      .order("full_name", { ascending: true });

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("Teachers fetch error:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    // Get class counts for each teacher
    const teachersWithStats = await Promise.all(
      (data || []).map(async (teacher) => {
        const { count: classCount } = await supabase
          .from("classes")
          .select("id", { count: "exact", head: true })
          .eq("teacher_id", teacher.id);

        return {
          ...teacher,
          class_count: classCount || 0,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: teachersWithStats,
      teachers: teachersWithStats, // For backward compatibility
      total: teachersWithStats.length,
      pagination: {
        page: 1,
        limit: teachersWithStats.length,
        total: teachersWithStats.length,
        total_pages: 1,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/teachers
 * Create a new teacher/staff member
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

    const body = await request.json();
    const { UserService } = await import("@/lib/services/userService");
    const userService = new UserService();

    logger.info("Creating teacher/staff via UserService", {
      email: body.email,
      full_name: body.full_name,
      role: body.role || "teacher",
    });

    // Use UserService for centralized creation logic
    const result = await userService.createUser({
      ...body,
      role: body.role || "teacher", // Use provided role or default to teacher
    } as any, "admin");

    return NextResponse.json({
      success: true,
      data: result,
      message: `Teacher/Staff created successfully`,
      tempPassword: result.tempPassword,
    });
  } catch (error) {
    logger.error("Error creating teacher/staff", error);
    return handleApiError(error);
  }
}
