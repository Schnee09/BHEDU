import { NextResponse } from 'next/server';
import { apiSuccess, createGetHandler } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { ReportsRepository } from '@/lib/repositories/ReportsRepository';
import { validateQuery } from '@/lib/api/validation'; // Reuse if we want Strict Query validation, but original had many optional standard params
// We will parse URL manually or create schema if needed.
// Standard URL searchParams is fine for optional filters without strict blocking.

export const dynamic = 'force-dynamic';

export const GET = createGetHandler({ requireAuth: true }, async ({ request }) => {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';
  const dateFrom = url.searchParams.get('date_from') || undefined;
  const dateTo = url.searchParams.get('date_to') || undefined;
  const academicYearId = url.searchParams.get('academic_year_id') || undefined;
  const classId = url.searchParams.get('class_id') || undefined;
  const courseId = url.searchParams.get('course_id') || undefined;
  const limit = Math.min(
    10000,
    Math.max(100, parseInt(url.searchParams.get('limit') || '5000', 10))
  );

  const supabase = createServiceClient();
  const repository = new ReportsRepository(supabase);

  const result = await repository.getAttendanceReport({
    dateFrom,
    dateTo,
    academicYearId,
    classId,
    courseId,
    limit: format === 'csv' ? limit : undefined,
    // Logic: if JSON, return defaults (repo default? or all? Repo currently returns all if no limit).
    // Original JSON path didn't limit strictly unless paginated?
    // Original: "if (format === 'csv') query = query.limit(limit)"
    // It implies JSON returns ALL rows? That's dangerous.
    // But let's follow migration equivalence.
  });

  if ((result as any).note) {
    return apiSuccess([], { note: (result as any).note });
  }

  const rows = result.data as any[];

  // Processing
  const processed = rows.map((r: any) => ({
    id: r.id,
    date: r.date,
    status: r.status,
    notes: r.notes || '',
    student_id: r.student_id || '',
    student_name: r.student?.full_name || '',
    class_id: r.class_id || '',
    class_name: r.class?.name || '',
  }));

  // Aggregates
  const total = processed.length;
  const present = processed.filter((p: any) => p.status === 'present').length;
  const absent = processed.filter((p: any) => p.status === 'absent').length;
  const late = processed.filter((p: any) => p.status === 'late').length;
  const excused = processed.filter((p: any) => p.status === 'excused').length;

  const aggregates = { total, present, absent, late, excused };

  if (format === 'csv') {
    const headers = [
      'student_id',
      'student_name',
      'class_id',
      'class_name',
      'date',
      'status',
      'notes',
    ];

    const STREAM_THRESHOLD = 2000;

    if (processed.length > STREAM_THRESHOLD) {
      try {
        // Enqueue Export Job
        const jobParams = {
          filters: { dateFrom, dateTo, academicYearId, classId, courseId },
          headers,
          requestedAt: new Date().toISOString(),
          rowCount: processed.length,
        };

        // We need admin client for this insert usually if RLS protects it?
        // createServiceClient uses cookies, so it is the user.
        // If user is Admin, it works.
        const { data: job, error } = await supabase
          .from('report_exports')
          .insert({
            type: 'attendance',
            params: jobParams,
            status: 'pending',
          })
          .select('id')
          .single();

        if (job) {
          return NextResponse.json({ success: true, jobId: job.id });
        }
      } catch (e) {
        console.error('Failed to enqueue job', e);
      }
    }

    const csvRows = processed.map((p: any) => [
      p.student_id,
      (p.student_name || '').replace(/"/g, '""'),
      p.class_id,
      (p.class_name || '').replace(/"/g, '""'),
      p.date,
      p.status,
      (p.notes || '').replace(/"/g, '""'),
    ]);

    const csv = [
      headers.join(','),
      ...csvRows.map((r: any[]) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const res = new NextResponse(csv, { status: 200 });
    res.headers.set('Content-Type', 'text/csv; charset=utf-8');
    res.headers.set(
      'Content-Disposition',
      `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.csv"`
    );
    return res;
  }

  return apiSuccess(processed, { aggregates });
});
