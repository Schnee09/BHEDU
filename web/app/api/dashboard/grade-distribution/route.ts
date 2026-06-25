import { apiSuccess, createGetHandler, serverError } from '@/lib/api';
import { createServiceClient } from '@/lib/supabase/server';

// Dashboard data is user-scoped
export const dynamic = 'force-dynamic';

interface GradeDistributionRow {
  band: string;
  student_count: string | number;
}

export const GET = createGetHandler({ requireAuth: true }, async ({ user }) => {
  const supabase = createServiceClient();

  // Determine if we should filter by teacher
  const isStaff = user.role === 'super_admin' || user.role === 'owner' || user.role === 'admin';
  const rpcParams = isStaff ? {} : { p_teacher_id: user.id };

  const { data, error } = await supabase.rpc('get_grade_distribution', rpcParams);

  if (error) {
    console.error('Error fetching grade distribution:', error);
    return serverError('Failed to fetch grade distribution');
  }

  const rawData = data as GradeDistributionRow[];

  // Map to AnalyticsWidget-compatible format
  const distribution = (rawData || []).map((item) => ({
    name: item.band,
    value:
      typeof item.student_count === 'string'
        ? parseInt(item.student_count)
        : item.student_count || 0,
  }));

  return apiSuccess({ distribution });
});
