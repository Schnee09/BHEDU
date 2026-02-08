import { apiSuccess, createApiHandler } from "@/lib/api";
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

export const PUT = createApiHandler(
  {
    requireAuth: true,
    allowedRoles: ["super_admin", "admin", "staff"],
    bodySchema: eventSchema,
  },
  async ({ body, params }) => {
    const { id } = params;
    const supabase = createServiceClient();

    const { data: event, error } = await supabase
      .from("calendar_events")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ event });
  },
);

export const DELETE = createApiHandler(
  {
    requireAuth: true,
    allowedRoles: ["super_admin", "admin", "staff"],
  },
  async ({ params }) => {
    const { id } = params;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return apiSuccess({ success: true });
  },
);
