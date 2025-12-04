import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Create client with user's token
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get user from token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build query based on role
    let query = supabase
      .from("assignments")
      .select(`
        id,
        title,
        due_date,
        class_id,
        classes(name)
      `)
      .order("due_date", { ascending: true });

    if (profile.role === "admin") {
      // Admin sees all
    } else if (profile.role === "teacher") {
      // Teacher sees own classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", profile.id);

      const classIds = classes?.map((c) => c.id) || [];
      if (classIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
      query = query.in("class_id", classIds);
    } else if (profile.role === "student") {
      // Student sees enrolled classes
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("class_id")
        .eq("student_id", profile.id);

      const enrolledIds = enrollments?.map((e) => e.class_id) || [];
      if (enrolledIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
      query = query.in("class_id", enrolledIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] Assignments error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data
    const assignments = data?.map((record: any) => ({
      id: record.id,
      title: record.title || "Untitled",
      due_date: record.due_date,
      class_id: record.class_id,
      class_name: record.classes?.name || "Unknown",
    }));

    return NextResponse.json({ data: assignments });
  } catch (error: any) {
    console.error("[API] Assignments unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
