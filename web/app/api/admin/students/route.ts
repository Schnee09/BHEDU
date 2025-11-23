import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/students
 * Fetch all students with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const classId = searchParams.get("class_id");

    // Build query - Note: profiles table doesn't have 'status' column
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, date_of_birth, phone, address, created_at")
      .eq("role", "student")
      .order("full_name", { ascending: true });

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // If filtering by class, join with enrollments
    if (classId) {
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("class_id", classId)
        .eq("status", "active");

      if (enrollError) throw enrollError;

      const studentIds = enrollments.map((e) => e.student_id);
      if (studentIds.length > 0) {
        query = query.in("id", studentIds);
      } else {
        // No students in this class
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
        });
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] Students fetch error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
    });
  } catch (error: any) {
    console.error("[API] Students error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/students
 * Create a new student
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, date_of_birth } = body;

    // Validation
    if (!email || !full_name) {
      return NextResponse.json(
        { success: false, error: "Email and full name are required" },
        { status: 400 }
      );
    }

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-8), // Temporary password
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create profile (no status column in database)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        email,
        full_name,
        role: "student",
        date_of_birth,
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error("[API] Create student error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
