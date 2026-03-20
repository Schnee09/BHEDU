/**
 * Admin Audit Logs API
 * GET /api/admin/audit-logs
 * Standardized to V5.0 Architecture
 */

import { apiPaginated, createGetHandler } from '@/lib/api';
import { DashboardService } from '@/lib/services/DashboardService';

export const GET = createGetHandler(
  { permission: 'system.audit' },
  async ({ searchParams, user }) => {
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const action = searchParams.get('action') || undefined;
    const resource_type = searchParams.get('resource_type') || undefined;
    const page = Math.floor(offset / limit) + 1;

    const { items, total } = await DashboardService.getRecentActivity(limit, user.role, user.id, {
      action,
      entityType: resource_type,
      offset,
    });

    return apiPaginated(items, {
      page,
      pageSize: limit,
      total,
    });
  }
);
