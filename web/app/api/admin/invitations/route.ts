import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
    try {
        const supabase = createServiceClient();

        // Check if user is admin/staff
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (
            !profile ||
            !["admin", "staff", "super_admin"].includes(profile.role)
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data: invites, error } = await supabase
            .from("user_invitations")
            .select(`
        *,
        invited_by:profiles!user_invitations_invited_by_fkey (
          full_name
        )
      `)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return NextResponse.json({ invites });
    } catch (error: any) {
        console.error("List invites error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { email, phone, role, expires_in_days = 7, metadata = {} } =
            await request.json();
        const supabase = createServiceClient();

        // Check if user is admin/staff
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const token = randomUUID();
        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + expires_in_days);

        const { data: invite, error } = await supabase
            .from("user_invitations")
            .insert({
                email,
                phone,
                role,
                token,
                invited_by: user.id,
                expires_at: expires_at.toISOString(),
                metadata,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, invite });
    } catch (error: any) {
        console.error("Create invite error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
