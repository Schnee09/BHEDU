import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await getDataClient(request)
    const searchParams = request.nextUrl.searchParams;
    const classId = searchParams.get("class_id");
    const categoryId = searchParams.get("category_id");

    let query = supabase
      .from("assignments")
      .select(`
        id,
        class_id,
        category_id,
        title,
        description,
        due_date,
        max_points,
        created_at,
        updated_at,
        class:classes!assignments_class_id_fkey(id, name),
        category:assignment_categories!assignments_category_id_fkey(id, name)
      `)
      .order("due_date", { ascending: false });

    if (classId) query = query.eq("class_id", classId);
    if (categoryId) query = query.eq("category_id", categoryId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
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
    const { supabase } = await getDataClient(request)
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
