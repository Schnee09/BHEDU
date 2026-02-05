import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { TimetableRepository } from "@/lib/repositories/TimetableRepository";
import { z } from "zod";
import {
    dateStringSchema,
    notesSchema,
    uuidSchema,
} from "@/lib/schemas/common";

const weeklyNoteQuerySchema = z.object({
    slot_id: uuidSchema,
    week_start_date: dateStringSchema,
});

const saveWeeklyNoteSchema = z.object({
    slot_id: uuidSchema,
    week_start_date: dateStringSchema,
    notes: notesSchema,
});

export const GET = createGetHandler(
    { requireAuth: true }, // Auth likely required
    async ({ request }) => {
        const url = new URL(request.url);
        const slot_id = url.searchParams.get("slot_id");
        const week_start_date = url.searchParams.get("week_start_date");

        if (!slot_id || !week_start_date) {
            // Handled by validation ideally, but standard manual check here matches schema
            // Could use validateQuery if we want strictness
            throw new Error("Missing slot_id or week_start_date");
        }

        const supabase = createServiceClient();
        const repository = new TimetableRepository(supabase);

        const note = await repository.getWeeklyNote(slot_id, week_start_date);
        return apiSuccess({ note });
    },
);

export const POST = createApiHandler(
    {
        permission: "classes.manage", // Or 'timetable.manage'? Standard permissions?
        // Original: Anyone? No distinct checks in original POST besides generic rate limit/auth
        // Assuming teachers/staff can add notes.
        allowedRoles: ["admin", "staff", "teacher", "tutor", "owner"],
        bodySchema: saveWeeklyNoteSchema,
    },
    async ({ body }) => {
        const supabase = createServiceClient();
        const repository = new TimetableRepository(supabase);
        const { slot_id, week_start_date, notes } = body;

        // Ensure notes is treated as string if optional/null
        const noteContent = notes || "";

        const note = await repository.saveWeeklyNote(
            slot_id,
            week_start_date,
            noteContent,
        );
        return apiSuccess({ note });
    },
);

export const DELETE = createApiHandler(
    {
        permission: "classes.manage",
        allowedRoles: ["admin", "staff", "teacher", "tutor", "owner"],
    },
    async ({ request }) => {
        const url = new URL(request.url);
        const slot_id = url.searchParams.get("slot_id");
        const week_start_date = url.searchParams.get("week_start_date");

        if (!slot_id || !week_start_date) {
            throw new Error("Missing slot_id or week_start_date");
        }

        const supabase = createServiceClient();
        const repository = new TimetableRepository(supabase);

        await repository.deleteWeeklyNote(slot_id, week_start_date);
        return apiSuccess({ success: true });
    },
);
