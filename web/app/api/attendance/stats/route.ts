/**
 * Attendance Stats API
 * GET /api/attendance/stats?classId=[classId]
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { teacherAuth } from "@/lib/auth/adminAuth";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
    try {
        const authResult = await teacherAuth(req);
        if (!authResult.authorized) {
            return NextResponse.json(
                { error: authResult.reason || "Unauthorized" },
                { status: 401 },
            );
        }

        const supabase = createServiceClient();
        const searchParams = req.nextUrl.searchParams;
        const classId = searchParams.get("classId");

        if (!classId) {
            return NextResponse.json(
                { error: "classId is required" },
                { status: 400 },
            );
        }

        // Get attendance stats
        const { data: attendance, error } = await supabase
            .from("attendance")
            .select("status")
            .eq("class_id", classId);

        if (error) {
            logger.error(`Failed to fetch stats for class ${classId}`, error);
            return NextResponse.json(
                { error: "Failed to fetch stats" },
                { status: 500 },
            );
        }

        const stats = {
            present: attendance.filter((a) => a.status === "present").length,
            absent: attendance.filter((a) => a.status === "absent").length,
            total: attendance.length,
        };

        return NextResponse.json(stats);
    } catch (error) {
        logger.error("Attendance stats error", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
