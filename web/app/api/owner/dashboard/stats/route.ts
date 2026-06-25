import { apiSuccess, createGetHandler } from '@/lib/api';
import { DashboardService } from '@/lib/services/DashboardService';

// Disable static caching for Owner Dashboard stats
export const dynamic = 'force-dynamic';

export const GET = createGetHandler({ allowedRoles: ['owner'] }, async () => {
  const stats = await DashboardService.getOwnerStats();
  return apiSuccess(stats);
});
