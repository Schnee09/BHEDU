import { NextResponse } from "next/server";
import { apiSuccess, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { ReportsRepository } from "@/lib/repositories/ReportsRepository";

export const dynamic = "force-dynamic";

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request }) => {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";
    const limit = Math.min(
      10000,
      Math.max(100, parseInt(url.searchParams.get("limit") || "5000", 10)),
    );

    const supabase = createServiceClient();
    const repository = new ReportsRepository(supabase);

    // CSV Export Flow
    if (format === "csv") {
      const students = await repository.getStudentsForExport(limit);

      const headers = [
        "ID",
        "Full Name",
        "Email",
        "Phone",
        "Grade Level",
        "Status",
        "Created At",
      ];
      const rows = (students || []).map((s: any) => [
        s.id,
        s.full_name || "",
        s.email || "",
        s.phone || "",
        s.grade_level || "",
        s.status || "",
        s.created_at ? new Date(s.created_at).toISOString() : "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((r: any[]) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const res = new NextResponse(csv, { status: 200 });
      res.headers.set("Content-Type", "text/csv; charset=utf-8");
      res.headers.set(
        "Content-Disposition",
        `attachment; filename="students_report_${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      );
      return res;
    }

    // JSON Demographics Flow
    const stats = await repository.getStudentDemographicsReport();
    return apiSuccess({
      total: stats.total,
      active: stats.active,
      inactive: stats.inactive,
      newThisMonth: stats.newThisMonth,
      byGrade: stats.byGrade,
      byGender: stats.byGender,
    });
  },
);
