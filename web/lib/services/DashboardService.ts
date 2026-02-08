import { createServiceClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { UserRole } from "@/lib/auth/core";
import { logger } from "@/lib/logger";
import {
    DashboardRepository,
    DashboardStats,
} from "../repositories/DashboardRepository";

export class DashboardService {
    private repository: DashboardRepository;

    constructor(supabase?: SupabaseClient) {
        const client = supabase || createServiceClient();
        this.repository = new DashboardRepository(client);
    }

    /**
     * Get aggregate statistics based on user role
     */
    async getStats(role: UserRole, profileId: string): Promise<DashboardStats> {
        try {
            return await this.repository.getBasicStats(role, profileId);
        } catch (error) {
            logger.error("Failed to fetch dashboard stats", error as Error);
            throw new Error("Failed to retrieve dashboard statistics");
        }
    }

    /**
     * Get recent system activity
     */
    async getRecentActivity(
        limit: number = 10,
        role?: UserRole,
        profileId?: string,
    ) {
        try {
            const logs = await this.repository.getRecentActivity(
                limit,
                role || "student",
                profileId || "",
            );

            return logs.map((item) => ({
                id: item.id,
                type: item.action,
                message: this.formatActivityMessage(item),
                user: item.full_name || "Hệ thống",
                timestamp: item.created_at,
            }));
        } catch (error) {
            logger.warn("Recent activity query failed, returning mockup", {
                error,
            });
            return this.getMockActivity();
        }
    }

    private formatActivityMessage(item: any): string {
        const entity = item.entity_type === "profiles"
            ? "Người dùng"
            : item.entity_type === "classes"
            ? "Lớp học"
            : item.entity_type === "grades"
            ? "Điểm số"
            : "Hệ thống";

        return `${item.action === "create" ? "Tạo mới" : "Cập nhật"} ${entity}`;
    }

    private getMockActivity() {
        return [
            {
                id: "1",
                type: "login",
                message: "Đăng nhập vào hệ thống",
                user: "Admin",
                timestamp: new Date().toISOString(),
            },
            {
                id: "2",
                type: "create",
                message: "Tạo lớp học mới: Math 101",
                user: "Teacher",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
        ];
    }

    // Static delegates for backward compatibility
    static async getStats(role: UserRole, profileId: string) {
        return dashboardService.getStats(role, profileId);
    }

    static async getRecentActivity(
        limit: number = 10,
        role?: UserRole,
        profileId?: string,
    ) {
        return dashboardService.getRecentActivity(limit, role, profileId);
    }
}

export const dashboardService = new DashboardService();
