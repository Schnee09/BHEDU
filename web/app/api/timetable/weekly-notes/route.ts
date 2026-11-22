import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { z } from 'zod';
import { dateStringSchema, notesSchema, uuidSchema } from '@/lib/schemas/common';
import { canAccessTimetableSlot } from '@/lib/auth/classAccess';
import { AuthorizationError } from '@/lib/api/errors';

const saveWeeklyNoteSchema = z.object({
  slot_id: uuidSchema,
  week_start_date: dateStringSchema,
  notes: notesSchema,
});

export const GET = createGetHandler({ permission: 'timetable.edit' }, async ({ request, user }) => {
  const url = new URL(request.url);
  const slot_id = url.searchParams.get('slot_id');
  const week_start_date = url.searchParams.get('week_start_date');

  if (!slot_id || !week_start_date) {
    // Handled by validation ideally, but standard manual check here matches schema
    // Could use validateQuery if we want strictness
    throw new Error('Missing slot_id or week_start_date');
  }

  const supabase = createServiceClient();
  if (!(await canAccessTimetableSlot(supabase, user, slot_id))) {
    throw new AuthorizationError('Bạn không có quyền xem ghi chú của lịch học này.');
  }
  const repository = new TimetableRepository(supabase);

  const note = await repository.getWeeklyNote(slot_id, week_start_date);
  return apiSuccess({ note });
});

export const POST = createApiHandler(
  {
    permission: 'timetable.edit',
    bodySchema: saveWeeklyNoteSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    if (!(await canAccessTimetableSlot(supabase, user, body.slot_id))) {
      throw new AuthorizationError('Bạn không có quyền cập nhật ghi chú của lịch học này.');
    }
    const repository = new TimetableRepository(supabase);
    const { slot_id, week_start_date, notes } = body;

    // Ensure notes is treated as string if optional/null
    const noteContent = notes || '';

    const note = await repository.saveWeeklyNote(slot_id, week_start_date, noteContent);
    return apiSuccess({ note });
  }
);

export const DELETE = createApiHandler(
  {
    permission: 'timetable.edit',
  },
  async ({ request, user }) => {
    const url = new URL(request.url);
    const slot_id = url.searchParams.get('slot_id');
    const week_start_date = url.searchParams.get('week_start_date');

    if (!slot_id || !week_start_date) {
      throw new Error('Missing slot_id or week_start_date');
    }

    const supabase = createServiceClient();
    if (!(await canAccessTimetableSlot(supabase, user, slot_id))) {
      throw new AuthorizationError('Bạn không có quyền xóa ghi chú của lịch học này.');
    }
    const repository = new TimetableRepository(supabase);

    await repository.deleteWeeklyNote(slot_id, week_start_date);
    return apiSuccess({ success: true });
  }
);
