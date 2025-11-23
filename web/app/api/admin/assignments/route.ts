import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("class_id");
    const categoryId = searchParams.get("category_id");

    // First, get assignment records
    let query = supabase
      .from("assignments")
      .select("*")
      .order("due_date", { ascending: false });

    if (classId) query = query.eq("class_id", classId);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data: assignmentData, error: assignmentError } = await query;
    if (assignmentError) throw assignmentError;

    if (!assignmentData || assignmentData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
      });
    }

    // Get unique class and category IDs
    const classIds = [...new Set(assignmentData.map(a => a.class_id).filter(Boolean))];
    const categoryIds = [...new Set(assignmentData.map(a => a.category_id).filter(Boolean))];

    // Fetch classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name")
      .in("id", classIds);

    // Fetch categories
    const { data: categories } = await supabase
      .from("assignment_categories")
      .select("id, name")
      .in("id", categoryIds);

    // Create lookup maps
    const classMap = new Map(classes?.map(c => [c.id, c]) || []);
    const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);

    // Combine data
    const enrichedData = assignmentData.map(assignment => ({
      ...assignment,
      class: assignment.class_id ? classMap.get(assignment.class_id) || null : null,
      category: assignment.category_id ? categoryMap.get(assignment.category_id) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedData,
      total: enrichedData.length,
    });
  } catch (error: any) {
    console.error("[API] Assignments error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { class_id, category_id, title, description, due_date, max_points = 100 } = body;

    if (!class_id || !title) {
      return NextResponse.json(
        { success: false, error: "Class ID and title are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        class_id,
        category_id,
        title,
        description,
        due_date,
        max_points,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Create assignment error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
