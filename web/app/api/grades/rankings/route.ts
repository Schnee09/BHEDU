import { apiSuccess, createGetHandler, serverError } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

// Cache the rankings for 1 hour to prevent DB load (ISR)
export const revalidate = 3600;

export const GET = createGetHandler({ requireAuth: true }, async ({ request, user }) => {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);

  // Use service client to calculate global rankings, bypassing RLS
  // so students can also see the top performers chart.
  const supabase = createServiceClient();

  // 1. Fetch rankings from Database RPC (highly optimized O(1) memory)
  const { data: rankings, error } = await supabase.rpc('get_student_rankings');

  if (error) {
    console.error('Error fetching rankings from RPC:', error);
    return serverError('Failed to calculate rankings');
  }

  const totalStudents = rankings ? rankings.length : 0;

  // 2. Map database columns to the frontend widget format
  interface StudentRankingRow {
    student_id: string;
    student_name: string;
    class_name: string;
    average: string | number;
    rank: string | number;
    percentile: string | number;
  }

  const formattedRankings = (rankings || []).map((student: StudentRankingRow) => ({
    studentId: student.student_id,
    studentName: student.student_name,
    className: student.class_name,
    average: Number(student.average),
    rank: Number(student.rank),
    percentile: Number(student.percentile),
    change: 0, // Mock trend for now
  }));

  // 3. Extract Top Performers
  const topStudents = formattedRankings.slice(0, limit);

  // 4. Extract At-Risk (Bottom Performers), maintaining the correct frontend format
  const atRiskStudents = [...formattedRankings]
    .reverse()
    .slice(0, limit)
    .map((student, index) => ({
      ...student,
      // The widget uses 'rank' as a reverse index for the at-risk list
      rank: totalStudents - index,
    }));

  return apiSuccess({
    topStudents,
    atRiskStudents,
  });
});
