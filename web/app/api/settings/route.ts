import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminAuth } from "@/lib/auth/adminAuth";

// GET: Get a setting by key or all settings
export async function GET(request: NextRequest) {
    // ... (rest of GET)
}

// PUT: Update a setting (admin only)
export async function PUT(request: NextRequest) {
    try {
        // Use the centralized adminAuth helper which supports super_admin via inheritance
        const auth = await adminAuth(request);
        if (!auth.authorized) {
            return NextResponse.json(
                { error: auth.reason || "Admin access required" },
                {
                    status: auth.authorized === false && auth.userId
                        ? 403
                        : 401,
                },
            );
        }

        const supabase = await createClient();

        const body = await request.json();
        const { key, value, value_json, description, category, is_public } =
            body;

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, {
                status: 400,
            });
        }

        const { data, error } = await supabase
            .from("settings")
            .upsert(
                {
                    key,
                    value: typeof value === "string" ? value : null,
                    value_json: typeof value === "object"
                        ? value
                        : value_json || null,
                    description,
                    category: category || "general",
                    is_public: is_public ?? false,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "key" },
            )
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, setting: data });
    } catch (error) {
        console.error("Settings update error:", error);
        return NextResponse.json(
            { error: "Failed to update setting" },
            { status: 500 },
        );
    }
}

// Helper function to get default settings
function getDefaultSettings(
    key?: string | null,
    category?: string | null,
): Record<string, string> {
    const defaults: Record<string, { value: string; category: string }> = {
        school_name: {
            value: "TRUNG TÂM GIÁO DỤC BÙI HOÀNG",
            category: "school",
        },
        school_name_short: { value: "BH-EDU", category: "school" },
        school_address: { value: "", category: "school" },
        school_phone: { value: "", category: "school" },
        school_email: { value: "", category: "school" },
        school_website: { value: "", category: "school" },
        school_logo_url: { value: "/logo.png", category: "school" },
        academic_year: { value: "2025-2026", category: "academic" },
        semester: { value: "2", category: "academic" },
        grading_scale: { value: "10", category: "academic" },
    };

    const result: Record<string, string> = {};

    for (const [k, v] of Object.entries(defaults)) {
        if (key && k !== key) continue;
        if (category && v.category !== category) continue;
        result[k] = v.value;
    }

    return result;
}
