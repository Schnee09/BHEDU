/**
 * Dashboard Statistics API
 * GET /api/dashboard/stats
 *
 * Returns aggregate statistics for the dashboard
 */

import { apiSuccess, createGetHandler } from "@/lib/api";
import { DashboardService } from "@/lib/services/DashboardService";

export const GET = createGetHandler(
  { requireAuth: true },
  async ({ user }) => {
    const [stats, activities] = await Promise.all([
      DashboardService.getStats(user.role, user.id),
      DashboardService.getRecentActivity(10, user.role, user.id),
    ]);

    return apiSuccess({
      ...stats,
      recentActivity: activities,
    });
  },
);
