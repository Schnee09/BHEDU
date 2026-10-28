import { NextResponse } from 'next/server';
import { createGetHandler, AppError, apiSuccess } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';
import { canAccessClass } from '@/lib/auth/classAccess';
import { isValidDateOnly } from '@/lib/enrollments/effectiveDates';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GET = createGetHandler({ requireAuth: true }, async ({ request, user, params }) => {
  const supabase = createServiceClient();
  const { classId } = (await params) as { classId: string };
  const url = new URL(request.url);
  const date = url.searchParams.get('date') || '';
  const search = (url.searchParams.get('search') || '').trim();

  if (!UUID_PATTERN.test(classId) || !isValidDateOnly(date)) {
    throw new AppError('Class and date are invalid', 400, 'VALIDATION_ERROR');
  }
  if (search.length < 2 || search.length > 100) {
    throw new AppError('Search must contain between 2 and 100 characters', 400, 'VALIDATION_ERROR');
  }
  if (!(await canAccessClass(supabase, { id: user.id, role: user.role }, classId))) {
    throw new AppError('Forbidden', 403, 'FORBIDDEN');
  }

  const normalizedSearch = search
    .replace(/[^\p{L}\p{N}\s_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (normalizedSearch.length < 2) {
    return apiSuccess([]);
  }

  const { data: candidates, error } = await supabase
    .from('profiles')
    .select('id, full_name, student_code, email')
    .eq('role', 'student')
    .eq('status', 'active')
    .is('deleted_at', null)
    .or(`full_name.ilike.%${normalizedSearch}%,student_code.ilike.%${normalizedSearch}%`)
    .order('full_name')
    .limit(20);

  if (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to search students' },
      { status: 500 }
    );
  }

  const candidateIds = (candidates || []).map((candidate) => candidate.id);
  if (candidateIds.length === 0) return apiSuccess([]);

  const [enrollmentResult, attendanceResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', classId)
      .in('student_id', candidateIds)
      .lte('enrollment_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`)
      .is('deleted_at', null),
    supabase
      .from('attendance')
      .select('student_id')
      .eq('class_id', classId)
      .eq('date', date)
      .in('student_id', candidateIds)
      .is('deleted_at', null),
  ]);

  if (enrollmentResult.error || attendanceResult.error) {
    return NextResponse.json(
      { success: false, error: 'Failed to verify attendance candidates' },
      { status: 500 }
    );
  }

  const enrollments = enrollmentResult.data;
  const attendance = attendanceResult.data;

  const excludedIds = new Set([
    ...(enrollments || []).map((item) => item.student_id),
    ...(attendance || []).map((item) => item.student_id),
  ]);

  return apiSuccess(
    (candidates || []).filter((candidate) => !excludedIds.has(candidate.id)).slice(0, 10)
  );
});
