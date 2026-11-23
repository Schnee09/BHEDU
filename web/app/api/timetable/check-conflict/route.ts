/**
 * Timetable Conflict Checking API
 * POST /api/timetable/check-conflict
 *
 * Check for scheduling conflicts (room or teacher double booking) before saving.
 */

import { apiSuccess, createApiHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { z } from 'zod';
import { AuthorizationError } from '@/lib/api/errors';
import { canAccessTimetableSlot, canAccessTimetableTarget } from '@/lib/auth/classAccess';

const checkConflictSchema = z.object({
  class_id: z.string().uuid().optional().nullable(),
  teacher_id: z.string().uuid().optional().nullable(),
  student_id: z.string().uuid().optional().nullable(),
  room: z.string().optional().nullable(),
  day_of_week: z.coerce.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  exclude_slot_id: z.string().uuid().optional().nullable(),
});

export const POST = createApiHandler(
  {
    permission: 'timetable.edit',
    bodySchema: checkConflictSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    if (
      body.exclude_slot_id &&
      !(await canAccessTimetableSlot(supabase, user, body.exclude_slot_id))
    ) {
      throw new AuthorizationError('Bạn không có quyền kiểm tra lịch học này.');
    }
    if (body.class_id || body.student_id || body.teacher_id) {
      if (
        !(await canAccessTimetableTarget(supabase, user, {
          classId: body.class_id,
          studentId: body.student_id,
          teacherId: body.teacher_id,
        }))
      ) {
        throw new AuthorizationError('Bạn không có quyền kiểm tra lịch cho đối tượng này.');
      }
    }

    const repository = new TimetableRepository(supabase);

    // Call checkConflicts in Repository
    const conflict = await repository.checkConflicts(
      {
        class_id: body.class_id,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        room: body.room,
        teacher_id: body.teacher_id,
        student_id: body.student_id,
        subject_id: '00000000-0000-0000-0000-000000000000', // Dummy subject ID
      } as any,
      body.exclude_slot_id || undefined
    );

    return apiSuccess({
      has_conflict: !!conflict,
      conflict_reason: conflict,
    });
  }
);
