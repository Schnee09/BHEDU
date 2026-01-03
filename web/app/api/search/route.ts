import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ students: [], classes: [] });
    }

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Search students
    const { data: students } = await supabase
      .from("students")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    // Search classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, grade_level")
      .or(`name.ilike.%${query}%`)
      .limit(10);

    return NextResponse.json({
      students: students || [],
      classes: classes || [],
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
