import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file || !type) {
      return NextResponse.json({ error: "File and type are required" }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) =>
      line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
    );

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process based on type
    if (type === "students") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const data: Record<string, string> = {};
          headers.forEach((header, idx) => {
            data[header] = row[idx] || "";
          });

          const { error } = await supabase.from("students").insert({
            full_name: data.full_name,
            email: data.email || null,
            phone: data.phone || null,
            date_of_birth: data.date_of_birth || null,
            class_id: data.class_id || null,
          });

          if (error) {
            failed++;
            errors.push(`Row ${i + 2}: ${error.message}`);
          } else {
            success++;
          }
        } catch (err) {
          failed++;
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }
    } else if (type === "grades") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const data: Record<string, string> = {};
          headers.forEach((header, idx) => {
            data[header] = row[idx] || "";
          });

          const { error } = await supabase.from("grades").insert({
            student_id: data.student_id,
            subject: data.subject,
            category: data.category || "Test",
            score: parseFloat(data.score) || 0,
            date: data.date || new Date().toISOString().split("T")[0],
          });

          if (error) {
            failed++;
            errors.push(`Row ${i + 2}: ${error.message}`);
          } else {
            success++;
          }
        } catch (err) {
          failed++;
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }
    } else if (type === "attendance") {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const data: Record<string, string> = {};
          headers.forEach((header, idx) => {
            data[header] = row[idx] || "";
          });

          const { error } = await supabase.from("attendance").insert({
            student_id: data.student_id,
            class_id: data.class_id,
            date: data.date,
            status: data.status || "present",
          });

          if (error) {
            failed++;
            errors.push(`Row ${i + 2}: ${error.message}`);
          } else {
            success++;
          }
        } catch (err) {
          failed++;
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid import type" }, { status: 400 });
    }

    // Log audit entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      action: "import",
      resource_type: type,
      new_data: { success, failed, total: rows.length },
    });

    return NextResponse.json({ success, failed, errors });
  } catch (error) {
    console.error("Bulk import error:", error);
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    );
  }
}
