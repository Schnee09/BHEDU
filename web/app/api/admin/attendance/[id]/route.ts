/**
 * Admin Individual Attendance Record API (REFACTORED)
 * GET /api/admin/attendance/[id] - Get attendance record details
 * PATCH /api/admin/attendance/[id] - Update attendance record
 * DELETE /api/admin/attendance/[id] - Delete attendance record
 */

import { NextResponse } from "next/server";
import { getDataClient } from "@/lib/auth/dataClient";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
// import { createAttendanceSchema } from "@/lib/api/schemas"; // Unused
import { NotFoundError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

// GET /api/admin/attendance/[id]
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ params, request }) => {
    const { supabase } = await getDataClient(request);

    const { data: record, error } = await supabase
      .from("attendance")
      .select(`
        *,
        student:profiles!attendance_student_id_fkey(
          id,
          full_name,
          email,
          student_code
        )
      `)
      .eq("id", params.id)
      .single();

    if (error || !record) {
      throw new NotFoundError("Attendance record not found");
    }

    // Fetch class info separately if needed (preserving previous logic)
    let classInfo = null;
    if (record.class_id) {
      const { data: classData } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          teacher:profiles!classes_teacher_id_fkey(
            full_name
          )
        `)
        .eq("id", record.class_id)
        .single();

      classInfo = classData;
    }

    return apiSuccess({
      ...record,
      class: classInfo,
    });
  },
);

// PATCH /api/admin/attendance/[id]
export const PATCH = createApiHandler(
  {
    allowedRoles: ["admin", "staff"],
    // Manual partial validation for attendance
  },
  async ({ params, body, request }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Verify record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from("attendance")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingRecord) {
      throw new NotFoundError("Attendance record not found");
    }

    // Allowed fields to update
    const allowedFields = ["status", "notes", "date"];
    const updates: Record<string, any> = {};

    for (const field of allowedFields) {
      if ((body as any)[field] !== undefined) {
        updates[field] = (body as any)[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid fields to update",
      }, { status: 400 });
    }

    // Update record
    const { data: updatedRecord, error: updateError } = await supabase
      .from("attendance")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating attendance record:", updateError);
      throw new Error(
        `Failed to update attendance record: ${updateError.message}`,
      );
    }

    return apiSuccess(updatedRecord);
  },
);

// DELETE /api/admin/attendance/[id]
export const DELETE = createGetHandler(
  { allowedRoles: ["admin"] },
  async ({ params, request }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Check if record exists
    const { data: record, error: fetchError } = await supabase
      .from("attendance")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !record) {
      throw new NotFoundError("Attendance record not found");
    }

    // Delete the record
    const { error: deleteError } = await supabase
      .from("attendance")
      .delete()
      .eq("id", id);

    if (deleteError) {
      logger.error("Error deleting attendance record:", deleteError);
      throw new Error(
        `Failed to delete attendance record: ${deleteError.message}`,
      );
    }

    return apiSuccess(null, {
      message: "Attendance record deleted successfully",
    });
  },
);
