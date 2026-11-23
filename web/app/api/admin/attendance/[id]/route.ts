/**
 * Admin Individual Attendance Record API (REFACTORED)
 * GET /api/admin/attendance/[id] - Get attendance record details
 * PATCH /api/admin/attendance/[id] - Update attendance record
 * DELETE /api/admin/attendance/[id] - Delete attendance record
 */

import { NextResponse } from 'next/server';
import { getDataClient } from '@/lib/auth/dataClient';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { AuthorizationError, NotFoundError } from '@/lib/api/errors';
import { logger } from '@/lib/logger';
import { updateAttendanceSchema } from '@/lib/schemas';
import { canAccessClass, canAccessStudent } from '@/lib/auth/classAccess';

// GET /api/admin/attendance/[id]
export const GET = createGetHandler(
  { permission: 'attendance.view' },
  async ({ params, request, user }) => {
    const { supabase } = await getDataClient(request);

    const { data: record, error } = await supabase
      .from('attendance')
      .select(
        `
        *,
        student:profiles!attendance_student_id_fkey(
          id,
          full_name,
          email,
          student_code
        )
      `
      )
      .eq('id', params.id)
      .is('deleted_at', null)
      .single();

    if (error || !record) {
      throw new NotFoundError('Attendance record not found');
    }

    const canViewRecord =
      (await canAccessClass(supabase, user, record.class_id)) ||
      (await canAccessStudent(supabase, user, record.student_id));
    if (!canViewRecord) {
      throw new AuthorizationError('Bạn không có quyền xem bản ghi điểm danh này.');
    }

    // Fetch class info separately if needed (preserving previous logic)
    let classInfo = null;
    if (record.class_id) {
      const { data: classData } = await supabase
        .from('classes')
        .select(
          `
          id,
          name,
          teacher:profiles!classes_teacher_id_fkey(
            full_name
          )
        `
        )
        .eq('id', record.class_id)
        .single();

      classInfo = classData;
    }

    return apiSuccess({
      ...record,
      class: classInfo,
    });
  }
);

// PATCH /api/admin/attendance/[id]
export const PATCH = createApiHandler(
  {
    permission: 'attendance.manage',
    bodySchema: updateAttendanceSchema,
  },
  async ({ params, body, request, user }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Verify record exists
    const { data: existingRecord, error: fetchError } = await supabase
      .from('attendance')
      .select('id, class_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingRecord) {
      throw new NotFoundError('Attendance record not found');
    }

    if (!(await canAccessClass(supabase, user, existingRecord.class_id))) {
      throw new AuthorizationError('Bạn không có quyền chỉnh sửa điểm danh của lớp này.');
    }

    const { notes, ...record } = body;
    const updates = notes === undefined ? record : { ...record, remarks: notes };

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields to update',
        },
        { status: 400 }
      );
    }

    // Update record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.error('Error updating attendance record:', updateError);
      throw new Error(`Failed to update attendance record: ${updateError.message}`);
    }

    return apiSuccess(updatedRecord);
  }
);

// DELETE /api/admin/attendance/[id]
export const DELETE = createGetHandler(
  { permission: 'attendance.manage' },
  async ({ params, request, user }) => {
    const { supabase } = await getDataClient(request);
    const id = params.id;

    // Check if record exists
    const { data: record, error: fetchError } = await supabase
      .from('attendance')
      .select('id, class_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !record) {
      throw new NotFoundError('Attendance record not found');
    }

    if (!(await canAccessClass(supabase, user, record.class_id))) {
      throw new AuthorizationError('Bạn không có quyền xóa điểm danh của lớp này.');
    }

    // Preserve the audit trail and allow an intentional restore through the create/upsert flow.
    const { error: deleteError } = await supabase
      .from('attendance')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      logger.error('Error deleting attendance record:', deleteError);
      throw new Error(`Failed to delete attendance record: ${deleteError.message}`);
    }

    return apiSuccess(null, {
      message: 'Attendance record deleted successfully',
    });
  }
);
