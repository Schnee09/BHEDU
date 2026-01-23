/**
 * Admin Semester Detail API
 * PUT /api/admin/semesters/[id] - Update semester
 * DELETE /api/admin/semesters/[id] - Delete semester
 */

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/adminAuth";
import { getDataClient } from "@/lib/auth/dataClient";
import { logger } from "@/lib/logger";

export async function PUT(
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
        const body = await request.json();
        const { name, code, start_date, end_date, is_active } = body;

        if (!name || !code || !start_date || !end_date) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 },
            );
        }

        // If updating as active, deactivate others
        if (is_active) {
            await supabase
                .from("semesters")
                .update({ is_active: false })
                .eq("is_active", true);
        }

        const { data: semester, error } = await supabase
            .from("semesters")
            .update({
                name,
                code,
                start_date,
                end_date,
                is_active: !!is_active,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            logger.error("Error updating semester:", error);
            return NextResponse.json(
                { error: "Failed to update semester", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            semester,
            message: "Semester updated successfully",
        });
    } catch (error: any) {
        logger.error("Error in PUT /api/admin/semesters/[id]:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 },
        );
    }
}

export async function DELETE(
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

        const { error } = await supabase
            .from("semesters")
            .delete()
            .eq("id", id);

        if (error) {
            logger.error("Error deleting semester:", error);
            return NextResponse.json(
                { error: "Failed to delete semester", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            message: "Semester deleted successfully",
        });
    } catch (error: any) {
        logger.error("Error in DELETE /api/admin/semesters/[id]:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 },
        );
    }
}
