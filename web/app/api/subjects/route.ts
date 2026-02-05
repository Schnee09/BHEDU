/**
 * Subjects API (REFACTORED)
 *
 * Uses caching for subjects list.
 *
 * GET /api/subjects - Fetch subjects
 * POST /api/subjects - Create a new subject
 */

import { NextResponse } from "next/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { createSubjectSchema } from "@/lib/schemas/common";
import { subjectService } from "@/lib/services/subjectService";
import { CACHE_KEYS, CACHE_TTL, cached, invalidateCache } from "@/lib/cache";
import { createClientFromRequest } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

// GET /api/subjects - Public with caching
export async function GET(req: NextRequest) {
  try {
    const subjects = await cached(
      CACHE_KEYS.SUBJECTS_ALL,
      async () => {
        const supabase = createClientFromRequest(req);
        const { data, error } = await supabase
          .from("subjects")
          .select("id, name, code, description")
          .order("name");

        if (error) {
          console.warn("Subjects query error", error);
          return [];
        }

        // Deduplicate by code (keep first entry)
        const seenCodes = new Set<string>();
        return (data || []).filter((s) => {
          const code = s.code?.toLowerCase();
          if (!code || seenCodes.has(code)) return false;
          seenCodes.add(code);
          return true;
        }).map((s) => ({ ...s, is_active: true }));
      },
      { ttl: CACHE_TTL.MEDIUM },
    );

    return NextResponse.json({ success: true, subjects });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, subjects: [] },
      { status: 200 },
    );
  }
}

// POST /api/subjects - Admin only
export const POST = createApiHandler(
  {
    allowedRoles: ["admin"],
    bodySchema: createSubjectSchema,
  },
  async ({ body }) => {
    const subject = await subjectService.createSubject(body);

    // Invalidate cache
    invalidateCache("subjects:");

    return apiSuccess(subject, { _status: 201 });
  },
);
