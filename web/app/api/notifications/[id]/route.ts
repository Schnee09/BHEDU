import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClientFromRequest(request);
        const { id } = await params;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const { error } = await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("id", id)
            .eq("user_id", user.id); // Secure: ensure user owns notification

        if (error) {
            console.error("Error updating notification:", error);
            return NextResponse.json(
                { error: "Failed to update notification" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in PATCH /api/notifications/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const supabase = await createClientFromRequest(request);
        const { id } = await params;

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        if (error) {
            console.error("Error deleting notification:", error);
            return NextResponse.json(
                { error: "Failed to delete notification" },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/notifications/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}
