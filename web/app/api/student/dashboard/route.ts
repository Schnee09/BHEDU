import { apiSuccess, createGetHandler } from '@/lib/api';
import { DashboardService } from '@/lib/services/DashboardService';

export const dynamic = 'force-dynamic';

/**
 * Student Dashboard API
 * GET /api/student/dashboard
 *
 * Returns specialized statistics and activity for the authenticated student
 */
export const GET = createGetHandler({ allowedRoles: ['student'] }, async ({ user }) => {
  const [stats, activitiesRes] = await Promise.all([
    DashboardService.getStudentStats(user.id),
    DashboardService.getRecentActivity(10, 'student', user.id),
  ]);

  return apiSuccess({
    ...stats,
    recentActivity: activitiesRes.items,
  });
});
