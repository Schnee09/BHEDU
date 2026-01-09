
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { student_code } = await request.json();

    if (!student_code) {
      return NextResponse.json({ error: "Student code is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: student, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("student_code", student_code.toUpperCase())
      .eq("role", "student")
      .single();

    if (error || !student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        email: student.email,
        full_name: student.full_name,
        role: student.role
      }
    });

  } catch (error) {
    console.error("Student lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
