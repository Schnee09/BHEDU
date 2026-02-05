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

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const page = parseInt(searchParams.get("page") || "1");
        const isRead = searchParams.get("is_read");
        const offset = (page - 1) * limit;

        let query = supabase
            .from("notifications")
            .select("*", { count: "exact" })
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);

        if (isRead !== null) {
            query = query.eq("is_read", isRead === "true");
        }

        const { data, count, error } = await query;

        if (error) {
            console.error("Error fetching notifications:", error);
            return NextResponse.json(
                { error: "Failed to fetch notifications" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            notifications: data,
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error("Error in GET /api/notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}

export async function PATCH(request: NextRequest) {
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

        // Mark all as read for user
        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", user.id)
            .eq("is_read", false);

        if (error) {
            console.error("Error updating notifications:", error);
            return NextResponse.json({
                error: "Failed to update notifications",
            }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in PATCH /api/notifications:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}
