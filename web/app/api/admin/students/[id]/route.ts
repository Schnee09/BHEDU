/**
 * Student Management API (REFACTORED)
 * GET /api/admin/students/[id] - Get student details
 * PUT /api/admin/students/[id] - Update student profile
 * DELETE /api/admin/students/[id] - Archive student (soft delete)
 */

import { NextResponse } from "next/server";
import { getDataClient } from "@/lib/auth/dataClient";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { logger } from "@/lib/logger";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import { updateStudentSchema } from "@/lib/schemas";

// GET /api/admin/students/[id]
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ params, request }) => {
    const { supabase } = await getDataClient(request);

    const { data: student, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", params.id)
      .eq("role", "student")
      .single();

    if (error || !student) {
      throw new NotFoundError("Student not found");
    }

    return apiSuccess(student);
  },
);

// PUT /api/admin/students/[id]
export const PUT = createApiHandler(
  {
    allowedRoles: ["admin", "staff"],
    bodySchema: updateStudentSchema,
  },
  async ({ params, body, request, user }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Validate student exists and is a student
    const { data: existingStudent } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", id)
      .single();

    if (!existingStudent || existingStudent.role !== "student") {
      throw new NotFoundError("Student not found");
    }

    // Business Logic: Check uniqueness if needed
    if (body.student_code) {
      const { data: duplicateCheck } = await supabase
        .from("profiles")
        .select("id")
        .eq("student_code", body.student_code)
        .neq("id", id)
        .maybeSingle();

      if (duplicateCheck) {
        throw new ValidationError(
          `Student code ${body.student_code} is already in use`,
        );
      }
    }

    if (body.email) {
      const { data: emailCheck } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", body.email.toLowerCase())
        .neq("id", id)
        .maybeSingle();

      if (emailCheck) {
        throw new ValidationError("Email is already in use");
      }
    }

    // Perform update
    const { data: updatedStudent, error: updateError } = await supabase
      .from("profiles")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("Failed to update student:", updateError);
      throw new Error(`Failed to update student: ${updateError.message}`);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "update",
      resource_type: "student",
      resource_id: id,
      details: { updated_fields: Object.keys(body) },
    });

    logger.info("Student updated successfully", {
      studentId: id,
      userId: user.id,
    });

    return apiSuccess(updatedStudent, {
      message: "Student updated successfully",
    });
  },
);

// DELETE /api/admin/students/[id]
export const DELETE = createGetHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ params, request, user }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    const { data: existingStudent } = await supabase
      .from("profiles")
      .select("id, role, full_name")
      .eq("id", id)
      .single();

    if (!existingStudent || existingStudent.role !== "student") {
      throw new NotFoundError("Student not found");
    }

    // Soft delete
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ status: "inactive" })
      .eq("id", id);

    if (updateError) {
      logger.error("Failed to archive student:", updateError);
      throw new Error(`Failed to archive student: ${updateError.message}`);
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "delete",
      resource_type: "student",
      resource_id: id,
      details: {
        action: "archived",
        student_name: existingStudent.full_name,
      },
    });

    logger.info("Student archived successfully", {
      studentId: id,
      userId: user.id,
    });

    return apiSuccess(null, { message: "Student archived successfully" });
  },
);
