/**
 * Admin Semester Activation API
 * POST /api/admin/semesters/[id]/activate - Activate a semester
 */

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/adminAuth";
import { getDataClient } from "@/lib/auth/dataClient";
import { logger } from "@/lib/logger";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const authResult = await adminAuth(request);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.reason || "Unauthorized" },
                { status: 401 },
            );
        }

        const { supabase } = await getDataClient(request);

        // Set all semesters to inactive
        const { error: deactivateError } = await supabase
            .from("semesters")
            .update({ is_active: false })
            .eq("is_active", true);

        if (deactivateError) {
            logger.error("Error deactivating semesters:", deactivateError);
            return NextResponse.json(
                { error: "Failed to deactivate other semesters" },
                { status: 500 },
            );
        }

        // Activate the selected semester
        const { data: semester, error: activateError } = await supabase
            .from("semesters")
            .update({ is_active: true })
            .eq("id", id)
            .select()
            .single();

        if (activateError) {
            logger.error("Error activating semester:", activateError);
            return NextResponse.json(
                { error: "Failed to activate semester" },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            semester,
            message: "Semester activated successfully",
        });
    } catch (error: any) {
        logger.error(
            "Error in POST /api/admin/semesters/[id]/activate:",
            error,
        );
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 },
        );
    }
}
