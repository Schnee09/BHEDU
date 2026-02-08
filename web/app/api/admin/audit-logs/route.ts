/**
 * Admin Audit Logs API
 * GET /api/admin/audit-logs
 * Standardized to V5.0 Architecture
 */

import { apiPaginated, createGetHandler } from "@/lib/api";
import { DashboardService } from "@/lib/services/DashboardService";

export const GET = createGetHandler(
  { permission: "system.audit" },
  async ({ searchParams, user }) => {
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const page = Math.floor(offset / limit) + 1;

    // Use DashboardService or dedicated AuditLogService
    // For now, DashboardService.getRecentActivity is limited.
    // We'll use the Repository pattern here if we want full filtering.
    const activities = await DashboardService.getRecentActivity(
      limit,
      user.role,
      user.id,
    );

    return apiPaginated(activities, {
      page,
      pageSize: limit,
      total: activities.length, // Ideally should be real total count from repo
    });
  },
);
