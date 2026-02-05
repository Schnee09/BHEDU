import { apiSuccess, createApiHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";

export const POST = createApiHandler(
    {
        allowedRoles: ["super_admin", "owner", "admin"], // Restricted to admins
        // No body schema required
    },
    async () => {
        const supabase = createServiceClient();

        // Call the RPC function created in migration
        const { error } = await supabase.rpc("refresh_performance_views");

        if (error) {
            throw error;
        }

        return apiSuccess({ message: "Performance views execution started" });
    },
);
