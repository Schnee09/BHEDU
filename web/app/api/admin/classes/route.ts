/**
 * Admin Classes API
 * GET/POST /api/admin/classes
 * Updated: 2025-12-08 - Standardized error handling
 */

import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/auth/adminAuth";
import { getDataClient } from '@/lib/auth/dataClient'
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

  const { supabase } = await getDataClient(request)
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const teacherId = searchParams.get("teacher_id");

    let query = supabase
      .from("classes")
      .select("id, name, teacher_id, created_at")
      .order("name", { ascending: true });

    if (search) query = query.ilike("name", `%${search}%`);
    if (teacherId) query = query.eq("teacher_id", teacherId);

    const { data, error } = await query;
    if (error) {
      logger.error("Classes fetch error:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    const classesWithStats = await Promise.all(
      (data || []).map(async (cls) => {
        const [enrollments, teacher] = await Promise.all([
          supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("class_id", cls.id),
          supabase.from("profiles").select("id, full_name, email").eq("id", cls.teacher_id).single()
        ]);

        return {
          ...cls,
          enrollment_count: enrollments.count || 0,
          teacher: teacher.data,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: classesWithStats,
      classes: classesWithStats,
      total: classesWithStats.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authorized) {
      throw new AuthenticationError(authResult.reason || "Unauthorized");
    }

  const { supabase } = await getDataClient(request)
    const body = await request.json();
    const { name, teacher_id } = body;

    if (!name) {
      throw new ValidationError("Class name is required");
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({ name, teacher_id })
      .select()
      .single();

    if (error) {
      logger.error("Create class error:", { error });
      throw new Error(`Database error: ${error.message}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
