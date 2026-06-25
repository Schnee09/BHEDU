import { apiSuccess, createApiHandler, noContent } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { updateTimetableSlotSchema } from '@/lib/schemas';
import { ConflictError } from '@/lib/api/errors';

export const PUT = createApiHandler(
  {
    permission: 'classes.manage',
    allowedRoles: ['admin', 'owner'],
    bodySchema: updateTimetableSlotSchema,
  },
  async ({ body, params }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    // Conflict check (exclude self)
    const conflictError = await repository.checkConflicts(body as any, id);
    if (conflictError) {
      throw new ConflictError(conflictError);
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

export const DELETE = createApiHandler(
  {
    permission: 'classes.manage',
    allowedRoles: ['admin', 'owner'],
  },
  async ({ params }) => {
    const id = params.id as string;
    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    await repository.delete(id);

    return apiSuccess({ success: true });
  }
);
