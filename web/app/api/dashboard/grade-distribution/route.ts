import { apiSuccess, createGetHandler, serverError } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

// Cache for 1 hour
export const revalidate = 3600;

interface GradeDistributionRow {
    band: string;
    student_count: string | number;
}

export const GET = createGetHandler(
    { requireAuth: true },
    async () => {
        const supabase = createServiceClient();

        const { data, error } = await supabase.rpc("get_grade_distribution");

        if (error) {
            console.error("Error fetching grade distribution:", error);
            return serverError("Failed to fetch grade distribution");
        }

        const rawData = data as GradeDistributionRow[];

        // Map to AnalyticsWidget-compatible format
        const distribution = (rawData || []).map((item) => ({
            name: item.band,
            value: typeof item.student_count === "string"
                ? parseInt(item.student_count)
                : item.student_count || 0,
        }));

        return apiSuccess({ distribution });
    },
);
