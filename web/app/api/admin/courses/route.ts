import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { teacherAuth } from "@/lib/auth/adminAuth";
import { logger } from "@/lib/logger";
import { TableColumns, mapCourseToAPI, type Course } from "@/lib/database.types";
import { validateTitle, validateDescription, ValidationError } from "@/lib/validation";

// GET: List all courses (admin/teacher access)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (admin or teacher)
    const authResult = await teacherAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("courses")
      .select(TableColumns.courses)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Failed to fetch courses", { error });
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Map name to title for frontend compatibility
    const coursesWithTitle = (data as Course[])?.map(mapCourseToAPI) || [];
    return NextResponse.json({ data: coursesWithTitle });
  } catch (error) {
    logger.error("Unexpected error in GET /api/admin/courses", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new course (admin/teacher access)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (admin or teacher)
    const authResult = await teacherAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();

    // Validate inputs
    try {
      const title = validateTitle(body.title);
      const description = body.description ? validateDescription(body.description) : null;
      const subject_id = typeof body.subject_id === "string" ? body.subject_id : null;
      const teacher_id = typeof body.teacher_id === "string" ? body.teacher_id : null;
      const academic_year_id = typeof body.academic_year_id === "string" ? body.academic_year_id : null;

      const supabase = createServiceClient();

      const insert = {
        name: title, // Map title to name for database
        description,
        subject_id,
        teacher_id,
        academic_year_id,
      };

      const { data, error } = await supabase
        .from("courses")
        .insert(insert)
        .select()
        .single();

      if (error) {
        logger.error("Failed to create course", { error, insert });
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Map name back to title for frontend
      const courseWithTitle = data ? mapCourseToAPI(data as Course) : data;
      return NextResponse.json({ data: courseWithTitle }, { status: 201 });
    } catch (err) {
      if (err instanceof ValidationError) {
        return NextResponse.json(
          { error: err.message },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (error) {
    logger.error("Unexpected error in POST /api/admin/courses", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
