/**
 * Single Subject API (REFACTORED)
 *
 * Uses the new createApiHandler pattern for cleaner, more maintainable code.
 *
 * GET /api/subjects/[id] - Get subject details
 * PUT /api/subjects/[id] - Update subject
 * DELETE /api/subjects/[id] - Delete subject
 */

import { NextResponse } from "next/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { updateSubjectSchema, uuidSchema, type UpdateSubjectInput } from "@/lib/schemas";
import { subjectService } from "@/lib/services/subjectService";
import { NotFoundError } from "@/lib/api/errors";
import { CACHE_KEYS, CACHE_TTL, cached, invalidateCache } from "@/lib/cache";

// GET /api/subjects/[id]
export const GET = createGetHandler(
  {
    allowedRoles: ["admin", "teacher", "student"],
  },
  async ({ params }) => {
    // Use cache for subject details
    const subject = await cached(
      `subject:${params.id}`,
      () => subjectService.getSubjectById(params.id),
      { ttl: CACHE_TTL.MEDIUM },
    );

    if (!subject) {
      throw new NotFoundError("Không tìm thấy môn học");
    }

    return apiSuccess(subject);
  },
);

// PUT /api/subjects/[id]
export const PUT = createApiHandler(
  {
    allowedRoles: ["admin"],
    bodySchema: updateSubjectSchema,
  },
  async ({ params, body }) => {
    const existing = await subjectService.getSubjectById(params.id);
    if (!existing) {
      throw new NotFoundError("Không tìm thấy môn học");
    }

    const updated = await subjectService.updateSubject(params.id, body);

    // Invalidate cache
    invalidateCache("subject:");
    invalidateCache(CACHE_KEYS.SUBJECTS_ALL);

    return apiSuccess(updated);
  },
);

// DELETE /api/subjects/[id]
export const DELETE = createGetHandler(
  {
    allowedRoles: ["admin"],
  },
  async ({ params, searchParams }) => {
    const hardDelete = searchParams.get("hard") === "true";

    const existing = await subjectService.getSubjectById(params.id);
    if (!existing) {
      throw new NotFoundError("Không tìm thấy môn học");
    }

    await subjectService.deleteSubject(params.id, hardDelete);

    // Invalidate cache
    invalidateCache("subject:");
    invalidateCache(CACHE_KEYS.SUBJECTS_ALL);

    return NextResponse.json({
      success: true,
      message: hardDelete ? "Đã xóa môn học" : "Đã vô hiệu hóa môn học",
    });
  },
);
