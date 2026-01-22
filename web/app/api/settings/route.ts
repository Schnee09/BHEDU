import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Get a setting by key or all settings
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const key = searchParams.get("key");
        const category = searchParams.get("category");

        let query = supabase
            .from("settings")
            .select("key, value, value_json, description, category, is_public");

        if (key) {
            query = query.eq("key", key);
        }

        if (category) {
            query = query.eq("category", category);
        }

        const { data, error } = await query;

        if (error) {
            // Table might not exist
            if (error.code === "PGRST204" || error.code === "42P01") {
                return NextResponse.json({
                    settings: getDefaultSettings(key, category),
                    source: "defaults",
                });
            }
            throw error;
        }

        // If no data, return defaults
        if (!data || data.length === 0) {
            return NextResponse.json({
                settings: getDefaultSettings(key, category),
                source: "defaults",
            });
        }

        // Transform to key-value object
        const settings: Record<string, string | object | null> = {};
        for (const s of data) {
            settings[s.key] = s.value_json || s.value;
        }

        return NextResponse.json({ settings, source: "database" });
    } catch (error) {
        console.error("Settings API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 },
        );
    }
}

// PUT: Update a setting (admin only)
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check if user is admin
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Admin access required" }, {
                status: 403,
            });
        }

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
