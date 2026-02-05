import { NextResponse } from "next/server";
import { apiSuccess, createGetHandler } from "@/lib/api";
import { createServiceClient } from "@/lib/supabase/server";
import { ReportsRepository } from "@/lib/repositories/ReportsRepository";
import { validateQuery } from "@/lib/api/validation"; // Validation if needed, or query access
import { asNumber, median } from "@/lib/utils/stats";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ request }) => {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";
    const academicYearId = url.searchParams.get("academic_year_id") ||
      undefined;
    const classId = url.searchParams.get("class_id") || undefined;
    const courseId = url.searchParams.get("course_id") || undefined;
    const bucketSize = Math.max(
      1,
      Math.min(50, parseInt(url.searchParams.get("bucket") || "10", 10)),
    );
    const limit = Math.min(
      10000,
      Math.max(100, parseInt(url.searchParams.get("limit") || "5000", 10)),
    );

    const supabase = createServiceClient();
    const repository = new ReportsRepository(supabase);

    // Fetch Data
    const result = await repository.getGradesReport({
      academic_year_id: academicYearId,
      class_id: classId,
      course_id: courseId,
      limit: format === "csv" ? limit : undefined, // Optimized limit only for CSV? Or fetch all for stats?
      // Original logic: fetched all unless CSV limited.
      // But for stats we need all data really.
      // Let's pass limit only if CSV to be safe on memory, but keep logic consistent.
    });

    if ((result as any).note) {
      return apiSuccess([], { note: (result as any).note });
    }

    const rows = result.data as any[];

    // Process Data
    const percentages: number[] = [];
    const pointsArray: number[] = [];

    const processed = rows.map((r) => {
      // Prioritize points_earned vs score logic from original
      const points = asNumber(r.points_earned ?? r.points ?? r.score);
      const maxPoints = asNumber(
        r.max_points ?? r.assignment?.max_points ?? r.max ?? null,
      );

      // If no maxPoints but score is 0-10, we can assume max 10?
      // Original logic:
      // const pct = (points !== null && maxPoints !== null && maxPoints > 0) ? (points / maxPoints) * 100 : null

      let pct = null;
      if (points !== null) {
        if (maxPoints !== null && maxPoints > 0) {
          pct = (points / maxPoints) * 100;
        } else if (
          r.score !== undefined && r.score !== null && maxPoints === null
        ) {
          // Fallback for 10-point scale grades without "max_points" column
          // Assuming score 0-10 is percentage-able against 10
          pct = (points / 10) * 100;
        }
      }

      if (pct !== null) percentages.push(Number(pct));
      if (points !== null) pointsArray.push(Number(points));

      return {
        id: r.id,
        student_id: r.student_id || r.student?.id || null,
        student_name: r.student?.full_name || null,
        class_id: r.class_id || r.class?.id || null,
        class_name: r.class?.name || null,
        assignment_id: r.assignment_id || r.assignment?.id || null,
        assignment_title: r.assignment?.title || null,
        points: points,
        max_points: maxPoints,
        percentage: pct,
        created_at: r.created_at,
      };
    });

    // Aggregates
    const avgPoints = pointsArray.length
      ? (pointsArray.reduce((s, v) => s + v, 0) / pointsArray.length)
      : null;
    const medianPct = median(percentages);

    // Buckets
    const buckets: Record<string, number> = {};
    const bucketCount = Math.ceil(100 / bucketSize);
    for (let i = 0; i < bucketCount; i++) {
      const low = i * bucketSize;
      const high = Math.min(100, (i + 1) * bucketSize);
      buckets[`${low}-${high}`] = 0;
    }

    percentages.forEach((p) => {
      const idx = Math.min(bucketCount - 1, Math.floor(p / bucketSize));
      const low = idx * bucketSize;
      const high = Math.min(100, (idx + 1) * bucketSize);
      buckets[`${low}-${high}`] = (buckets[`${low}-${high}`] || 0) + 1;
    });

    const aggregates = {
      total_records: rows.length,
      average_points: avgPoints !== null ? Number(avgPoints.toFixed(2)) : null,
      median_percentage: medianPct !== null
        ? Number(medianPct.toFixed(2))
        : null,
      buckets,
    };

    // Export CSV
    if (format === "csv") {
      const headers = [
        "student_id",
        "student_name",
        "class_id",
        "class_name",
        "assignment_id",
        "assignment_title",
        "points",
        "max_points",
        "percentage",
      ];
      const csvRows = processed.map((p) => [
        p.student_id ?? "",
        (p.student_name ?? "").replace(/"/g, '""'),
        p.class_id ?? "",
        (p.class_name ?? "").replace(/"/g, '""'),
        p.assignment_id ?? "",
        (p.assignment_title ?? "").replace(/"/g, '""'),
        p.points !== null ? Number(p.points).toFixed(2) : "",
        p.max_points !== null ? Number(p.max_points).toFixed(2) : "",
        p.percentage !== null ? Number(p.percentage).toFixed(2) : "",
      ]);

      const csv = [
        headers.join(","),
        ...csvRows.map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const res = new NextResponse(csv, { status: 200 });
      res.headers.set("Content-Type", "text/csv; charset=utf-8");
      res.headers.set(
        "Content-Disposition",
        `attachment; filename="grades_report_${
          new Date().toISOString().split("T")[0]
        }.csv"`,
      );
      return res;
    }

    return apiSuccess([], { aggregates, sample_rows: processed.slice(0, 200) });
  },
);
