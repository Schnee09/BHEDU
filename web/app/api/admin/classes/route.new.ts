import { NextRequest, NextResponse } from "next/server";
import { getDataClient } from '@/lib/auth/dataClient'

export async function GET(request: NextRequest) {
  try {
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
    if (error) throw error;

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
  } catch (error: any) {
    console.error("[API] Classes error:", error);
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
    const { name, teacher_id } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Class name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("classes")
      .insert({ name, teacher_id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Create class error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
