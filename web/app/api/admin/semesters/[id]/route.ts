/**
 * Admin Semester Detail API
 * PUT /api/admin/semesters/[id] - Update semester (full or partial)
 * PATCH /api/admin/semesters/[id] - Update semester (partial)
 * DELETE /api/admin/semesters/[id] - Delete semester
 */

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/adminAuth";
import { getDataClient } from "@/lib/auth/dataClient";
import { logger } from "@/lib/logger";

async function handleUpdate(
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

        const updateData: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (start_date !== undefined) updateData.start_date = start_date;
        if (end_date !== undefined) updateData.end_date = end_date;
        if (is_active !== undefined) updateData.is_active = Boolean(is_active);

        if (Object.keys(updateData).length <= 1) {
            return NextResponse.json(
                { error: "No fields provided to update" },
                { status: 400 },
            );
        }

        // If updating as active, deactivate others
        if (updateData.is_active) {
            await supabase
                .from("semesters")
                .update({ is_active: false })
                .eq("is_active", true);
        }

        const { data: semester, error } = await supabase
            .from("semesters")
            .update(updateData)
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
        logger.error("Error in PUT/PATCH /api/admin/semesters/[id]:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 },
        );
    }
}

export const PUT = handleUpdate;
export const PATCH = handleUpdate;

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
