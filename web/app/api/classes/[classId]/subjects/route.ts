import { NextResponse } from "next/server";
import { apiSuccess, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { NotFoundError } from "@/lib/api/errors";

/**
 * GET /api/classes/[classId]/subjects
 * Fetch subjects linked to a class via timetable_slots
 */
export const GET = createGetHandler(
    { permission: "classes.view" },
    async ({ params }) => {
        const supabase = createServiceClient();
        const { classId } = params;

        // 1. Verify class exists
        const { data: classData, error: classError } = await supabase
            .from("classes")
            .select("id, name")
            .eq("id", classId)
            .single();

        if (classError || !classData) {
            throw new NotFoundError("Không tìm thấy lớp học");
        }

        // 2. Fetch unique subjects from timetable_slots for this class
        const { data: slots, error: slotsError } = await supabase
            .from("timetable_slots")
            .select(`
        subject_id,
        subject:subjects (
          id,
          name,
          code
        )
      `)
            .eq("class_id", classId);

        if (slotsError) {
            throw slotsError;
        }

        // 3. Extract unique subjects
        const subjectMap = new Map();
        (slots || []).forEach((slot: any) => {
            if (slot.subject && !subjectMap.has(slot.subject.id)) {
                subjectMap.set(slot.subject.id, slot.subject);
            }
        });

        const subjects = Array.from(subjectMap.values());

        return apiSuccess({ subjects });
    },
);
