import { apiSuccess, createGetHandler, serverError } from '@/lib/api';
import { AuthorizationError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';

// Dashboard data is user-scoped
export const dynamic = 'force-dynamic';

interface GradeDistributionRow {
  band: string;
  student_count: string | number;
}

const GLOBAL_ANALYTICS_ROLES = new Set(['super_admin', 'owner', 'admin']);
const ASSIGNED_CLASS_ROLES = new Set(['teacher', 'tutor', 'staff']);

export const GET = createGetHandler({ permission: 'grades.view' }, async ({ user }) => {
  const supabase = createServiceClient();

  if (!GLOBAL_ANALYTICS_ROLES.has(user.role) && !ASSIGNED_CLASS_ROLES.has(user.role)) {
    throw new AuthorizationError('Bạn không có quyền xem thống kê điểm này');
  }

  const rpcParams = GLOBAL_ANALYTICS_ROLES.has(user.role) ? {} : { p_teacher_id: user.id };

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
