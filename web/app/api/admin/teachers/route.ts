/**
 * Admin Teachers API
 * GET/POST /api/admin/teachers
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'
import { adminAuth } from "@/lib/auth/adminAuth";
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/api/errors";
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

    // Build query
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, date_of_birth, phone, address, created_at")
      .eq("role", "teacher")
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
      })
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
        total_pages: 1
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/teachers
 * Create a new teacher
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

  const { supabase } = await getDataClient(request);
    const body = await request.json();
    const { email, full_name, date_of_birth, phone } = body;

    // Validation
    if (!email || !full_name) {
      throw new ValidationError("Email and full name are required");
    }

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8), // Temporary password
      email_confirm: true,
    });

    if (authError) {
      logger.error("Create teacher auth error:", { error: authError });
      throw new Error(`Auth error: ${authError.message}`);
    }

    // Create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        email,
        full_name,
        role: "teacher",
        date_of_birth,
        phone,
      })
      .select()
      .single();

    if (profileError) {
      logger.error("Create teacher profile error:", { error: profileError });
      throw new Error(`Database error: ${profileError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
