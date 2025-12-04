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

    // Build base query (don't embed classes join here because FK name may vary)
    let query = supabase
      .from("attendance")
      .select(`id, class_id, student_id, date, status`)
      .order("date", { ascending: false });

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
      // Student sees own attendance
      query = query.eq("student_id", profile.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[API] Attendance query error:", error);
      return NextResponse.json({ 
        error: error.message,
        details: error.details,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    // If no attendance records, return empty array
    if (!data || data.length === 0) {
      return NextResponse.json({ data: [] });
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

    return NextResponse.json({ data: attendance });
  } catch (error: any) {
    console.error("[API] Attendance unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
