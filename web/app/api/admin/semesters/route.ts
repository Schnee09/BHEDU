/**
 * Admin Semesters API
 * GET /api/admin/semesters - Fetch all semesters (with active status)
 * POST /api/admin/semesters - Create a new semester
 */

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/adminAuth";
import { getDataClient } from "@/lib/auth/dataClient";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
    try {
        const authResult = await adminAuth(request);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.reason || "Unauthorized" },
                { status: 401 },
            );
        }

        const { supabase } = await getDataClient(request);

        const { data: semesters, error } = await supabase
            .from("semesters")
            .select("*")
            .order("start_date", { ascending: false });

        if (error) {
            logger.error("Error fetching admin semesters:", error);
            return NextResponse.json(
                { error: "Failed to fetch semesters", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            semesters: semesters || [],
        });
    } catch (error: any) {
        logger.error("Error in GET /api/admin/semesters:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    try {
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

        // Validation
        if (!name || !code || !start_date || !end_date) {
            return NextResponse.json(
                {
                    error:
                        "Missing required fields: name, code, start_date, end_date",
                },
                { status: 400 },
            );
        }

        // If setting as active, deactivate others
        if (is_active) {
            await supabase
                .from("semesters")
                .update({ is_active: false })
                .eq("is_active", true);
        }

        const { data: semester, error } = await supabase
            .from("semesters")
            .insert({
                name,
                code,
                start_date,
                end_date,
                is_active: !!is_active,
            })
            .select()
            .single();

        if (error) {
            logger.error("Error creating semester:", error);
            return NextResponse.json(
                { error: "Failed to create semester", details: error.message },
                { status: 500 },
            );
        }

        return NextResponse.json({
            success: true,
            semester,
            message: "Semester created successfully",
        });
    } catch (error: any) {
        logger.error("Error in POST /api/admin/semesters:", error);
        return NextResponse.json(
            { error: "Internal server error", details: error.message },
            { status: 500 },
        );
    }
}
