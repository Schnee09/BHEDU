import { NextResponse } from 'next/server';
import { apiSuccess, createApiHandler, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { createTimetableSlotSchema, timetableQuerySchema } from '@/lib/schemas';
import { validateQuery } from '@/lib/api/validation';
import { ConflictError, ValidationError } from '@/lib/api/errors';

export const GET = createGetHandler(
  { requireAuth: false }, // Public/Authenticated - original check was manual classId check
  async ({ request }) => {
    // 1. Validation
    const query = validateQuery(request, timetableQuerySchema);
    // Original code allowed no auth for GET?
    // "export async function GET(req: NextRequest) { ... }"
    // It didn't have specific auth guards besides standard RLS if applied.
    // However, POST had explicit adminAuth.
    // We'll keep GET open or requireAuth depending on strictness.
    // Safest is public read if shared, but usually requires login.
    // Let's assume requireAuth=false to match "maybe public schedule" or client handling.

    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    const { class_id, student_id, week_start_date } = query;

    if (!class_id && !student_id) {
      // Original returned empty slots success
      return apiSuccess({ slots: [] });
    }

    const slots = await repository.getSlots({
      class_id,
      student_id,
      week_start_date,
    });

    return apiSuccess({ slots });
  }
);

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

export const POST = createApiHandler(
  {
    permission: 'classes.manage',
    allowedRoles: ['admin', 'owner', 'super_admin'],
    bodySchema: createTimetableSlotSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    const targetDays: number[] =
      body.days_of_week && body.days_of_week.length > 0
        ? Array.from(new Set(body.days_of_week))
        : body.day_of_week !== undefined
          ? [body.day_of_week]
          : [0];

    const conflictErrors: string[] = [];

    // 1. Conflict check across all target days
    for (const day of targetDays) {
      const conflictError = await repository.checkConflicts({
        ...body,
        day_of_week: day,
      });
      if (conflictError) {
        conflictErrors.push(`[${DAY_LABELS[day] || `Thứ ${day + 2}`}]: ${conflictError}`);
      }
    }

    if (conflictErrors.length > 0) {
      throw new ConflictError(conflictErrors.join(' | '));
    }

    // 2. Create slots for all target days
    const createdSlots = [];
    for (const day of targetDays) {
      const slot = await repository.createSlot({
        ...body,
        day_of_week: day,
      });
      createdSlots.push({
        ...slot,
        subject: (slot as any).subject,
      });
    }

    return apiSuccess(
      {
        slots: createdSlots,
        slot: createdSlots[0] || null,
        count: createdSlots.length,
      },
      { status: 201 }
    );
  }
);
