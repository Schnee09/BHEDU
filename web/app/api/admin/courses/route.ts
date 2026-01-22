/**
 * Admin Courses API
 *
 * CRUD operations for courses management.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: List all courses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const gradeLevel = searchParams.get("grade_level");
    const isActive = searchParams.get("is_active");
    const subjectId = searchParams.get("subject_id");

    let query = supabase
      .from("courses")
      .select(`
        id,
        code,
        name,
        name_vi,
        description,
        subject_id,
        grade_level,
        credits,
        hours_per_week,
        is_required,
        is_active,
        semester,
        created_at,
        updated_at,
        subjects (id, name)
      `)
      .order("grade_level", { ascending: true })
      .order("name", { ascending: true });

    if (gradeLevel) {
      query = query.eq("grade_level", parseInt(gradeLevel));
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet
      if (error.code === "PGRST204" || error.code === "42P01") {
        return NextResponse.json({
          courses: [],
          message: "Courses table not yet created. Please run the migration.",
        });
      }
      throw error;
    }

    return NextResponse.json({ courses: data || [] });
  } catch (error) {
    console.error("Courses API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 },
    );
  }
}

// POST: Create a new course
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin or staff
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!profile || !["admin", "staff"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Admin or staff access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      code,
      name,
      name_vi,
      description,
      subject_id,
      grade_level,
      credits,
      hours_per_week,
      is_required,
      is_active,
      semester,
    } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: "Course code and name are required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        code,
        name,
        name_vi: name_vi || null,
        description: description || null,
        subject_id: subject_id || null,
        grade_level: grade_level || null,
        credits: credits || 1,
        hours_per_week: hours_per_week || 2,
        is_required: is_required ?? true,
        is_active: is_active ?? true,
        semester: semester || 1,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A course with this code already exists" },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, course: data }, { status: 201 });
  } catch (error) {
    console.error("Create course error:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 },
    );
  }
}
