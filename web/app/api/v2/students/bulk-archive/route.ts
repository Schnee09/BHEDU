import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSuccess, createApiHandler } from "@/lib/api";
import { StudentRepository } from "@/lib/repositories/StudentRepository";
import { createServiceClient } from "@/lib/supabase/server";

const bulkArchiveSchema = z.object({
    studentIds: z.array(z.string()),
});

export const POST = createApiHandler(
    {
        allowedRoles: ["admin", "staff", "super_admin", "owner"],
        bodySchema: bulkArchiveSchema,
    },
    async ({ body }) => {
        const { studentIds } = body;

        const supabase = createServiceClient();
        const repository = new StudentRepository(supabase);

        await repository.bulkArchive(studentIds);

        return apiSuccess({
            message: `Successfully archived ${studentIds.length} students`,
            archivedCount: studentIds.length,
        });
    },
);
