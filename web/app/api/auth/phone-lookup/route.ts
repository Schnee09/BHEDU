import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: "Số điện thoại là bắt buộc" }, {
                status: 400,
            });
        }

        // Format phone to E.164
        const formattedPhone = phone.startsWith("0")
            ? `+84${phone.substring(1)}`
            : phone;

        const supabase = createServiceClient();

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, full_name, role, account_status")
            .eq("phone", formattedPhone)
            .single();

        if (error || !profile) {
            return NextResponse.json({
                success: false,
                error: "Số điện thoại chưa được đăng ký",
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            profile: {
                id: profile.id,
                full_name: profile.full_name,
                role: profile.role,
                status: profile.account_status,
            },
        });
    } catch (error) {
        console.error("Phone lookup error:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}
