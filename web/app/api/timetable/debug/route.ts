/**
 * Debug API for student timetable
 * GET /api/timetable/debug
 */

import { NextRequest, NextResponse } from "next/server";
import {
    createClientFromRequest,
    createServiceClient,
} from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    try {
        const supabase = createClientFromRequest(req);

        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("id, role, full_name")
            .eq("user_id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, {
                status: 404,
            });
        }

        const serviceClient = createServiceClient();

        // 1. Get enrollments
        const { data: enrollments, error: enrollError } = await serviceClient
            .from("enrollments")
            .select("id, class_id, status, classes(id, name)")
            .eq("student_id", profile.id);

        // 2. Get active semester
        const { data: activeSemester } = await serviceClient
            .from("semesters")
            .select("id, name, is_active")
            .eq("is_active", true)
            .single();

        // 3. Get all semesters
        const { data: allSemesters } = await serviceClient
            .from("semesters")
            .select("id, name, is_active");

        // 4. Get timetable slots for enrolled classes (without semester filter)
        const classIds = enrollments?.map((e) => e.class_id) || [];
        let slotsWithoutFilter: any[] = [];
        let slotsWithFilter: any[] = [];

        if (classIds.length > 0) {
            const { data: slots1 } = await serviceClient
                .from("timetable_slots")
                .select(
                    "id, class_id, semester_id, day_of_week, start_time, classes(name)",
                )
                .in("class_id", classIds);
            slotsWithoutFilter = slots1 || [];

            if (activeSemester) {
                const { data: slots2 } = await serviceClient
                    .from("timetable_slots")
                    .select(
                        "id, class_id, semester_id, day_of_week, start_time, classes(name)",
                    )
                    .in("class_id", classIds)
                    .eq("semester_id", activeSemester.id);
                slotsWithFilter = slots2 || [];
            }
        }

        // 5. Get all timetable slots to see what semester_ids exist
        const { data: allSlots } = await serviceClient
            .from("timetable_slots")
            .select("semester_id")
            .limit(100);

        const uniqueSemesterIds = [
            ...new Set(allSlots?.map((s) => s.semester_id) || []),
        ];

        return NextResponse.json({
            profile: {
                id: profile.id,
                role: profile.role,
                name: profile.full_name,
            },
            enrollments: {
                count: enrollments?.length || 0,
                data: enrollments,
                error: enrollError,
            },
            semesters: {
                active: activeSemester,
                all: allSemesters,
            },
            timetableSlots: {
                classIds,
                withoutSemesterFilter: {
                    count: slotsWithoutFilter.length,
                    data: slotsWithoutFilter.slice(0, 10),
                },
                withSemesterFilter: {
                    count: slotsWithFilter.length,
                    semesterId: activeSemester?.id,
                    data: slotsWithFilter.slice(0, 10),
                },
                uniqueSemesterIdsInDB: uniqueSemesterIds,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
