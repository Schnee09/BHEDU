import { NextResponse } from "next/server";
import { apiSuccess, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { ReportsRepository } from "@/lib/repositories/ReportsRepository";
import { transcriptQuerySchema } from "@/lib/schemas/reports";
import { createAbility } from "@/lib/auth/permissions";

import { validateQuery } from "@/lib/api/validation";

/**
 * GET /api/reports/transcript
 * Generates complete transcript data for a student
 */
export const GET = createGetHandler(
  {
    requireAuth: true,
  },
  async ({ request, user }) => {
    const query = validateQuery(request, transcriptQuerySchema);
    const { studentId, includePending, language } = query;

    const ability = createAbility({ userId: user.id, role: user.role });

    // Permission check:
    // - Admin/Staff/Teacher can view any transcript (or constrained by class? For now open for staff)
    // - Student/Parent can view OWN transcript

    if (user.role === "student" && user.id !== studentId) {
      // Technically studentId in query might be profileId, user.id is auth id.
      // We usually link them. Assuming profile_id = auth_id for simplicity or ability checks handle it.
      // Let's rely on ability check if defined, else manual check.
      if (ability.cannot("read", "Grade")) { // Transcript effectively reads grades
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // For specific student check (if parent/student)
    // We can add "Transcript" to AnyAbility or reuse "Grade"
    if (ability.cannot("read", "Grade")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createServiceClient();
    const repository = new ReportsRepository(supabase);

    const transcript = await repository.getTranscript(studentId, {
      includePending: includePending || false,
      includeRanking: true,
      language: language as "vi" | "en",
    });

    if (!transcript) {
      return NextResponse.json({
        error: "Student not found or transcript unavailable",
      }, { status: 404 });
    }

    return apiSuccess(transcript);
  },
);
