import { apiSuccess, createGetHandler, serverError } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

// Dynamic route — cannot use ISR (revalidate) because it requires auth
export const dynamic = 'force-dynamic';

export const GET = createGetHandler({ requireAuth: true }, async ({ request, user }) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const teacherId = url.searchParams.get('teacher_id');

  // Use service client to calculate global rankings, bypassing RLS
  const supabase = createServiceClient();

  // 1. Fetch rankings from Database RPC
  const { data: rankings, error } = await supabase.rpc('get_student_rankings');

  if (error) {
    console.error('Error fetching rankings from RPC:', error);
    return serverError('Failed to calculate rankings');
  }

  // 2. Query class names if filtering by teacher
  let teacherClassNames: string[] = [];
  if (teacherId) {
    const { data: teacherClasses } = await supabase
      .from('classes')
      .select('name')
      .eq('teacher_id', teacherId);
    teacherClassNames = teacherClasses?.map((c: any) => c.name) || [];
  }

  const totalStudents = rankings ? rankings.length : 0;

  interface StudentRankingRow {
    student_id: string;
    student_name: string;
    class_name: string;
    average: string | number;
    rank: string | number;
    percentile: string | number;
  }

  // 3. Map database columns
  const formattedRankings = (rankings || []).map((student: StudentRankingRow) => ({
    studentId: student.student_id,
    studentName: student.student_name,
    className: student.class_name,
    average: Number(student.average),
    rank: Number(student.rank),
    percentile: Number(student.percentile),
    change: 0,
  }));

  // 4. Filter by teacher's classes if requested
  let filteredRankings = formattedRankings;
  if (teacherId) {
    if (teacherClassNames.length === 0) {
      return apiSuccess({
        topStudents: [],
        atRiskStudents: [],
      });
    }
    filteredRankings = formattedRankings.filter((student: any) =>
      teacherClassNames.includes(student.className)
    );
  }

  const filteredTotal = filteredRankings.length;

  // 5. Extract Top Performers
  const topStudents = filteredRankings.slice(0, limit);

  // 6. Extract At-Risk (Bottom Performers)
  const atRiskStudents = [...filteredRankings]
    .reverse()
    .slice(0, limit)
    .map((student: any, index: number) => ({
      ...student,
      rank: filteredTotal - index,
    }));

  return apiSuccess({
    topStudents,
    atRiskStudents,
  });
});
