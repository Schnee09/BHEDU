/**
 * Admin Courses [id] API
 *
 * GET, PUT, DELETE operations for individual courses.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: Get single course
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Course not found" }, {
          status: 404,
        });
      }
      throw error;
    }

    return NextResponse.json({ course: data });
  } catch (error) {
    console.error("Get course error:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 },
    );
  }
}

// PUT: Update course
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const updateData: Record<string, unknown> = {};

    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (name_vi !== undefined) updateData.name_vi = name_vi;
    if (description !== undefined) updateData.description = description;
    if (subject_id !== undefined) updateData.subject_id = subject_id;
    if (grade_level !== undefined) updateData.grade_level = grade_level;
    if (credits !== undefined) updateData.credits = credits;
    if (hours_per_week !== undefined) {
      updateData.hours_per_week = hours_per_week;
    }
    if (is_required !== undefined) updateData.is_required = is_required;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (semester !== undefined) updateData.semester = semester;

    const { data, error } = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Course not found" }, {
          status: 404,
        });
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A course with this code already exists" },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, course: data });
  } catch (error) {
    console.error("Update course error:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 },
    );
  }
}

// DELETE: Delete course (admin only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is admin
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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Course not found" }, {
          status: 404,
        });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: "Course deleted" });
  } catch (error) {
    console.error("Delete course error:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 },
    );
  }
}
