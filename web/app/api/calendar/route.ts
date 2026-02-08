import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  event_type: z.string().min(1, "Loại sự kiện là bắt buộc"),
  start_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Định dạng ngày không hợp lệ",
  ),
  end_date: z.string().regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Định dạng ngày không hợp lệ",
  ).nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  is_all_day: z.boolean().default(true),
  color: z.string().optional(),
  description: z.string().nullable().optional(),
});

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request }) => {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year") ||
      new Date().getFullYear().toString();
    const month = searchParams.get("month") ||
      (new Date().getMonth() + 1).toString();

    const supabase = createServiceClient();

    // Calculate date range for the month
    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1;
    const nextYear = parseInt(month) === 12
      ? parseInt(year) + 1
      : parseInt(year);
    const endDate = `${nextYear}-${nextMonth.toString().padStart(2, "0")}-01`;

    const { data: events, error } = await supabase
      .from("calendar_events")
      .select(
        "id, title, description, event_type, start_date, end_date, start_time, end_time, is_all_day, color",
      )
      .gte("start_date", startDate)
      .lt("start_date", endDate)
      .order("start_date");

    if (error) throw error;

    return apiSuccess({ events: events || [] });
  },
);

export const POST = createApiHandler(
  {
    requireAuth: true,
    allowedRoles: ["super_admin", "admin", "staff"],
    bodySchema: eventSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();

    const insertData = {
      ...body,
      color: body.color || "#6366f1",
      created_by: user.id,
    };

    const { data: event, error } = await supabase
      .from("calendar_events")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ event });
  },
);
