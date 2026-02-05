/**
 * Admin Courses API (REFACTORED)
 *
 * CRUD operations for courses management using standard API handler.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { createCourseSchema } from "@/lib/schemas";
import { CACHE_KEYS, CACHE_TTL, cached, invalidateCache } from "@/lib/cache";

// GET: List all courses with caching
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff"] },
  async ({ searchParams }) => {
    const gradeLevel = searchParams.get("grade_level");
    const isActive = searchParams.get("is_active");
    const subjectId = searchParams.get("subject_id");

    // Build unique cache key based on filters
    const cacheKey = `${CACHE_KEYS.SUBJECTS_ALL}:filtered:${
      gradeLevel || "all"
    }:${isActive || "all"}:${subjectId || "all"}`;

    const courses = await cached(
      cacheKey,
      async () => {
        const supabase = await createClient();
        let query = supabase
          .from("courses")
          .select(`
            *,
            subjects (id, name)
          `)
          .order("grade_level", { ascending: true })
          .order("name", { ascending: true });

        if (gradeLevel) {
          query = query.eq("grade_level", parseInt(gradeLevel));
        }

        if (isActive !== null) {
          query = query.eq("is_active", isActive === "true");
        }

        if (subjectId) {
          query = query.eq("subject_id", subjectId);
        }

        const { data, error } = await query;

        if (error) {
          if (error.code === "PGRST204" || error.code === "42P01") {
            return [];
          }
          throw error;
        }

        return data || [];
      },
      { ttl: CACHE_TTL.MEDIUM, tags: ["courses"] },
    );

    return apiSuccess(courses);
  },
);

// POST: Create a new course
export const POST = createApiHandler(
  {
    allowedRoles: ["admin", "staff"],
    bodySchema: createCourseSchema,
  },
  async ({ body }) => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("courses")
      .insert({
        ...body,
        name_vi: (body as any).name_vi || null,
        description: body.description || null,
        credits: body.credits || 1,
        hours_per_week: (body as any).hours_per_week || 2,
        is_required: (body as any).is_required ?? true,
        is_active: (body as any).is_active ?? true,
        semester: (body as any).semester || 1,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "A course with this code already exists" },
          { status: 409 },
        );
      }
      throw error;
    }

    // Invalidate course cache
    invalidateCache("courses");

    return apiSuccess(data, { _status: 201 });
  },
);
