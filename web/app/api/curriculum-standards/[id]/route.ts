import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/auth/guard";
import { hasPermission } from "@/lib/auth/core";

// Validation schema for updates
const updateCurriculumStandardSchema = z.object({
  subject_id: z.string().uuid().optional(),
  grade_level: z.string().optional(),
  academic_year_id: z.string().uuid().optional(),
  standard_code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  learning_objectives: z.array(z.string()).optional(),
  competencies: z.array(z.string()).optional(),
  assessment_criteria: z.array(z.string()).optional(),
});

// GET /api/curriculum-standards/[id] - Get specific curriculum standard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const supabase = await createClientFromRequest(request);

    const { data: standard, error } = await supabase
      .from("curriculum_standards")
      .select(`
        *,
        subjects (
          id,
          name,
          code,
          category
        ),
        academic_years (
          id,
          name,
          start_year,
          end_year
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Curriculum standard not found" },
          { status: 404 },
        );
      }
      console.error("Error fetching curriculum standard:", error);
      return NextResponse.json(
        { error: "Failed to fetch curriculum standard" },
        { status: 500 },
      );
    }

    return NextResponse.json(standard);
  } catch (error) {
    console.error("Error in GET /api/curriculum-standards/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/curriculum-standards/[id] - Update curriculum standard
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { authorized } = await getAuthContext(request, "curriculum.manage");
    if (!authorized) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    const supabase = await createClientFromRequest(request);
    const body = await request.json();
    const validatedData = updateCurriculumStandardSchema.parse(body);

    // Check if the standard exists
    const { data: existing, error: checkError } = await supabase
      .from("curriculum_standards")
      .select("id, subject_id, grade_level, academic_year_id, standard_code")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Curriculum standard not found" },
        { status: 404 },
      );
    }

    // If updating standard_code, check for conflicts
    if (
      validatedData.standard_code &&
      validatedData.standard_code !== existing.standard_code
    ) {
      const conflictCheck = await supabase
        .from("curriculum_standards")
        .select("id")
        .eq("subject_id", validatedData.subject_id || existing.subject_id)
        .eq("grade_level", validatedData.grade_level || existing.grade_level)
        .eq(
          "academic_year_id",
          validatedData.academic_year_id || existing.academic_year_id,
        )
        .eq("standard_code", validatedData.standard_code)
        .neq("id", id)
        .single();

      if (conflictCheck.data) {
        return NextResponse.json(
          { error: "Curriculum standard with this code already exists" },
          { status: 409 },
        );
      }
    }

    const { data: standard, error } = await supabase
      .from("curriculum_standards")
      .update(validatedData)
      .eq("id", id)
      .select(`
        *,
        subjects (
          id,
          name,
          code,
          category
        ),
        academic_years (
          id,
          name,
          start_year,
          end_year
        )
      `)
      .single();

    if (error) {
      console.error("Error updating curriculum standard:", error);
      return NextResponse.json(
        { error: "Failed to update curriculum standard" },
        { status: 500 },
      );
    }

    return NextResponse.json(standard);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Error in PUT /api/curriculum-standards/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/curriculum-standards/[id] - Delete curriculum standard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    // Only admins/super_admins usually have "curriculum.manage" AND "system.settings" or similar high level
    // Changing this to check "curriculum.manage" as defined in core.ts (which admins/staff/teachers have)
    // But DELETE usually restricted to admins. Let's check permissions.
    // Core definition: "curriculum.manage" is given to admins, staff, teachers.
    // If we want ONLY admins to delete, we might need a specific permission or just check role.
    // However, sticking to capability based:

    // Use getAuthContext but add a specific check if we want to restrict DELETE to admins
    // Or assume "curriculum.manage" is enough.
    // The previous code restricted to "admin" or "super_admin".
    // "curriculum.manage" is currently: Admin, Staff, Teacher.
    // Maybe verify if Teacher should replace standards. Probably not.
    // Teachers usually create/edit but removing standards might be higher level.
    // Let's use "curriculum.manage" for now as it's the capability we defined.
    // If strict admin is needed, we can check `isAdmin` from context or similar.

    const { authorized, role } = await getAuthContext(
      request,
      "curriculum.manage",
    );
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Strict check for DELETE: Admin only?
    // Using hasPermission(role, "system.settings") as a proxy for high level admin?
    // Or just check if role is admin/super_admin for this dangerous action if we don't have separate delete permission.
    // We didn't define "curriculum.delete".
    // Let's use isAtLeast(role, 'admin') equivalent logic via core check if we want strictness,
    // OR just use "curriculum.manage" if we trust staff/teachers.
    // Previous code: !["admin", "super_admin"].includes(profile.role)

    // I will use hasPermission(role, 'users.delete.soft') as a proxy for admin-level delete capability? No that's weird.
    // I'll stick to checking if they have "curriculum.manage" BUT also filter out teachers if intended.
    // Actually, let's respect the previous intent: Admin Only.
    // "admin" inherits from "staff".
    // "staff" has "curriculum.manage".
    // "teacher" has "curriculum.manage".
    // So "curriculum.manage" is too broad for DELETE if we want ONLY admin.
    // I will add a check: hasPermission(role, 'roles.manage') which is Admin only.

    if (!hasPermission(role!, "roles.manage")) { // Admin/SuperAdmin only
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only admins can delete curriculum standards.",
        },
        { status: 403 },
      );
    }

    const supabase = await createClientFromRequest(request);

    // Check if the standard exists
    const { data: existing, error: checkError } = await supabase
      .from("curriculum_standards")
      .select("id, title")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: "Curriculum standard not found" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("curriculum_standards")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting curriculum standard:", error);
      return NextResponse.json(
        { error: "Failed to delete curriculum standard" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Curriculum standard deleted successfully",
      deleted_standard: existing,
    });
  } catch (error) {
    console.error("Error in DELETE /api/curriculum-standards/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
