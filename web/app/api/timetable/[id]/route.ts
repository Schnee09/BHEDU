import { apiSuccess, createApiHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { updateTimetableSlotSchema } from '@/lib/schemas';
import { ConflictError } from '@/lib/api/errors';
import { AuthorizationError } from '@/lib/api/errors';
import { canAccessTimetableSlot, canAccessTimetableTarget } from '@/lib/auth/classAccess';

export const PUT = createApiHandler(
  {
    permission: 'timetable.edit',
    bodySchema: updateTimetableSlotSchema,
  },
  async ({ body, params, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    if (!(await canAccessTimetableSlot(supabase, user, id))) {
      throw new AuthorizationError('Bạn không có quyền cập nhật lịch học này.');
    }

    const changesTarget =
      body.class_id !== undefined || body.student_id !== undefined || body.teacher_id !== undefined;
    if (
      changesTarget &&
      !(await canAccessTimetableTarget(supabase, user, {
        classId: body.class_id,
        studentId: body.student_id,
        teacherId: body.teacher_id,
      }))
    ) {
      throw new AuthorizationError('Bạn không có quyền chuyển lịch sang đối tượng này.');
    }

    // Only run conflict check when scheduling fields are being changed
    const hasSchedulingFields =
      body.day_of_week !== undefined ||
      body.start_time !== undefined ||
      body.end_time !== undefined ||
      body.room !== undefined ||
      body.teacher_id !== undefined;
    if (hasSchedulingFields) {
      const conflictError = await repository.checkConflicts(body as any, id);
      if (conflictError) {
        throw new ConflictError(conflictError);
      }
    }

    const slot = await repository.update(id, body);

    // Transform (consistent with list/create)
    const transformedSlot = {
      ...slot,
      subject: (slot as any).subject,
      teacher: (slot as any).teacher,
      student: (slot as any).student,
      // Weekly notes not strictly needed on update return usually, unless UI expects it
    };

    return apiSuccess({ slot: transformedSlot });
  }
);

export const PATCH = PUT;

export const DELETE = createApiHandler(
  {
    permission: 'timetable.edit',
  },
  async ({ params, user }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    if (!(await canAccessTimetableSlot(supabase, user, id))) {
      throw new AuthorizationError('Bạn không có quyền xóa lịch học này.');
    }

    await repository.delete(id);

    return apiSuccess({ success: true });
  }
);
