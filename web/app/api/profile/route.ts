import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
    try {
        const authSupabase = createClientFromRequest(request);
        const { data: { session }, error: authError } = await authSupabase.auth.getSession();

        if (authError || !session?.user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const serviceSupabase = createServiceClient();

        let { data: profile, error } = await serviceSupabase
            .from("profiles")
            .select("id, user_id, full_name, first_name, last_name, role, email, phone, address, date_of_birth, personal_email")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (!profile && !error) {
            const result = await serviceSupabase
                .from("profiles")
                .select("id, user_id, full_name, first_name, last_name, role, email, phone, address, date_of_birth, personal_email")
                .eq("id", session.user.id)
                .maybeSingle();
            profile = result.data;
            error = result.error;
        }

        if (error) {
            logger.error("Failed to fetch profile:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(profile);
    } catch (err: any) {
        logger.error("Unexpected error in GET /api/profile:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        // 1. Authenticate
        const authSupabase = createClientFromRequest(request);
        const { data: { session }, error: authError } = await authSupabase.auth.getSession();

        if (authError || !session?.user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        // 2. Parse body
        const body = await request.json();
        const { full_name, first_name, last_name, phone, address, date_of_birth, personal_email } = body;

        if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0) {
            return NextResponse.json({ error: "Họ và tên không được để trống" }, { status: 400 });
        }

        // 3. Build safe payload — never touch id, role, email, user_id directly
        const updatePayload: Record<string, unknown> = {
            full_name: full_name.trim(),
            first_name: first_name?.trim() || null,
            last_name: last_name?.trim() || null,
            phone: phone?.trim() || null,
            address: address?.trim() || null,
            date_of_birth: date_of_birth || null,
            personal_email: personal_email?.trim() || null,
            updated_at: new Date().toISOString(),
        };

        // 4. Use service client to bypass RLS for the write
        const serviceSupabase = createServiceClient();

        // Try matching by user_id first (preferred), fallback to id (legacy accounts)
        let { data: updated, error } = await serviceSupabase
            .from("profiles")
            .update(updatePayload)
            .eq("user_id", session.user.id)
            .select("id, full_name, first_name, last_name, phone, address, date_of_birth, personal_email")
            .maybeSingle();

        if (!updated && !error) {
            // Legacy: profile.id === auth.uid
            const result = await serviceSupabase
                .from("profiles")
                .update(updatePayload)
                .eq("id", session.user.id)
                .select("id, full_name, first_name, last_name, phone, address, date_of_birth, personal_email")
                .maybeSingle();
            updated = result.data;
            error = result.error;
        }

        if (error) {
            logger.error("Profile update failed:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!updated) {
            return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
        }

        return NextResponse.json({ profile: updated });
    } catch (err: any) {
        logger.error("Unexpected error in PATCH /api/profile:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

