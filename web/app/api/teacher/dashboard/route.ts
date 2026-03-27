import { apiSuccess, createGetHandler } from '@/lib/api';
import { DashboardService } from '@/lib/services/DashboardService';

export const dynamic = 'force-dynamic';

/**
 * Teacher Dashboard API
 * GET /api/teacher/dashboard
 *
 * Returns specialized statistics and activity for the authenticated teacher
 */
export const GET = createGetHandler({ allowedRoles: ['teacher'] }, async ({ user }) => {
  const [stats, activitiesRes] = await Promise.all([
    DashboardService.getStats('teacher', user.id),
    DashboardService.getRecentActivity(10, 'teacher', user.id),
  ]);

  return apiSuccess({
    ...stats,
    recentActivity: activitiesRes.items,
  });
});
