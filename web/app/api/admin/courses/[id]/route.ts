/**
 * Admin Courses [id] API (REFACTORED)
 *
 * GET, PUT, DELETE operations for individual courses using standard API handler.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { updateCourseSchema } from "@/lib/schemas";
import { NotFoundError } from "@/lib/api/errors";
import { CACHE_KEYS, CACHE_TTL, cached, invalidateCache } from "@/lib/cache";

// GET: Get single course with caching
export const GET = createGetHandler(
  { allowedRoles: ["admin", "staff", "teacher", "student"] },
  async ({ params }) => {
    const id = params.id;

    const course = await cached(
      CACHE_KEYS.CLASS(id), // Reusing CLASS key as a generic detail key
      async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
          .from("courses")
          .select(`
            *,
            subjects (id, name)
          `)
          .eq("id", id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            throw new NotFoundError("Course not found");
          }
          throw error;
        }

        return data;
      },
      { ttl: CACHE_TTL.MEDIUM },
    );

    return apiSuccess(course);
  },
);

// PUT: Update course
export const PUT = createApiHandler(
  {
    allowedRoles: ["admin", "staff"],
    bodySchema: updateCourseSchema,
  },
  async ({ params, body }) => {
    const id = params.id;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("courses")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Course not found");
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "A course with this code already exists" },
          { status: 409 },
        );
      }
      throw error;
    }

    // Invalidate caches
    invalidateCache("courses");
    invalidateCache(id);

    return apiSuccess(data);
  },
);

// DELETE: Delete course
export const DELETE = createGetHandler(
  { allowedRoles: ["admin"] },
  async ({ params }) => {
    const id = params.id;
    const supabase = await createClient();

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) {
      if (error.code === "PGRST116") {
        throw new NotFoundError("Course not found");
      }
      throw error;
    }

    // Invalidate caches
    invalidateCache("courses");
    invalidateCache(id);

    return apiSuccess(null, { message: "Course deleted" });
  },
);
