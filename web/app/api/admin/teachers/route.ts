import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client (bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/teachers
 * Fetch all teachers with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");

    // Build query - profiles table columns: id, full_name, email, role, date_of_birth, phone, address, created_at
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
      console.error("[API] Teachers fetch error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
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
  } catch (error: any) {
    console.error("[API] Teachers error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/teachers
 * Create a new teacher
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, date_of_birth, phone } = body;

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

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error("[API] Create teacher error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
