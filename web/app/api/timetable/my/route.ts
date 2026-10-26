import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';
import { AppError } from '@/lib/api';
import { isValidDateOnly } from '@/lib/enrollments/effectiveDates';

export const dynamic = 'force-dynamic';

export const GET = createGetHandler(
  { requireAuth: true }, // Auth is strictly required for "My" timetable
  async ({ request, user }) => {
    const url = new URL(request.url);
    const weekStartDate = url.searchParams.get('week_start_date') || undefined;
    if (weekStartDate && !isValidDateOnly(weekStartDate)) {
      throw new AppError(
        'week_start_date must use a valid YYYY-MM-DD format',
        400,
        'VALIDATION_ERROR'
      );
    }

    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    const result = await repository.getMySlots(user.id, user.role, weekStartDate);

    return apiSuccess({
      slots: result.slots,
      classes: result.classes,
      role: user.role,
    });
  }
);
