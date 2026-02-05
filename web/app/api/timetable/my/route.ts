import { apiSuccess, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { TimetableRepository } from "@/lib/repositories/TimetableRepository";

export const GET = createGetHandler(
  { requireAuth: true }, // Auth is strictly required for "My" timetable
  async ({ request, user }) => {
    const url = new URL(request.url);
    const weekStartDate = url.searchParams.get("week_start_date") || undefined;

    const supabase = createServiceClient();
    const repository = new TimetableRepository(supabase);

    const result = await repository.getMySlots(
      user.id,
      user.role,
      weekStartDate,
    );

    return apiSuccess({
      slots: result.slots,
      classes: result.classes,
      role: user.role,
    });
  },
);
