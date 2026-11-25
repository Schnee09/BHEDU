/**
 * Dashboard Statistics API
 * GET /api/dashboard/stats
 *
 * Returns aggregate statistics for the dashboard
 */

import { apiSuccess, createGetHandler } from '@/lib/api';
import { DashboardService } from '@/lib/services/DashboardService';

// Dashboard data is user-scoped, must be dynamic
export const dynamic = 'force-dynamic';

export const GET = createGetHandler({ permission: 'reports.center_view' }, async ({ user }) => {
  // Permission has already established center-wide visibility. Normalize the data scope so
  // custom roles do not receive a mixture of global and profile-scoped dashboard metrics.
  const centerScopeRole = 'admin' as const;
  const [stats, activitiesRes] = await Promise.all([
    DashboardService.getStats(centerScopeRole, user.id),
    DashboardService.getRecentActivity(10, centerScopeRole, user.id),
  ]);

  return apiSuccess({
    ...stats,
    recentActivity: activitiesRes.items,
  });
});
