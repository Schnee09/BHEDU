import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClientFromRequest(request);

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const { count, error } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) {
            console.error("Error counting notifications:", error);
            return NextResponse.json(
                { error: "Failed to count notifications" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            count: count || 0,
        });
    } catch (error) {
        console.error("Error in GET /api/notifications/unread-count:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}
