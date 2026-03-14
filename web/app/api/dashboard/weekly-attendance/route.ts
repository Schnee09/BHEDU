import { apiSuccess, createGetHandler, serverError } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

// Cache for 1 hour
export const revalidate = 3600;

export const GET = createGetHandler(
    { requireAuth: true },
    async () => {
        const supabase = createServiceClient();

        const { data, error } = await supabase.rpc("get_weekly_attendance");

        if (error) {
            console.error("Error fetching weekly attendance:", error);
            return serverError("Failed to fetch weekly attendance");
        }

        // Map to AnalyticsWidget-compatible format
        const weeklyData = (data || []).map((item: any) => ({
            name: item.day_name,
            present: parseFloat(item.attendance_rate) || 0,
        }));

        return apiSuccess({ weeklyData });
    },
);
