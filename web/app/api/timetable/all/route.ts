import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { TimetableRepository } from '@/lib/repositories/TimetableRepository';

export const GET = createGetHandler(
  {
    requireAuth: true,
    allowedRoles: ['admin', 'staff', 'owner', 'super_admin'],
    // Original checked 'staffAuth'.
  },
  async ({ request }) => {
    const url = new URL(request.url);
    const weekStartDate = url.searchParams.get('week_start_date') || undefined;

    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    const slots = await repository.getAllSlots(weekStartDate);

    // Transformation to match exact original format if frontend relies on it
    const transformedSlots = slots.map((slot: any) => ({
      ...slot,
      // The repository already returns 'subject', 'teacher', 'student', 'class' relationships
      // and 'weekly_note', 'has_weekly_note'.
    }));

    return apiSuccess({ slots: transformedSlots });
  }
);
