import { BaseRepository } from "./base";
import { UserRole } from "@/lib/auth/core";
import { SupabaseClient } from "@supabase/supabase-js";

export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    totalAssignments: number;
    attendanceToday: number;
}

export interface ActivityLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata: any;
    created_at: string;
    full_name: string | null;
    avatar_url: string | null;
}

export class DashboardRepository extends BaseRepository<any, any, any> {
    protected readonly tableName = "audit_logs";
    protected readonly primaryKey = "id";

    constructor(supabase: SupabaseClient) {
        super(supabase);
    }

    /**
     * Get basic counts for the dashboard
     */
    async getBasicStats(
        role: UserRole,
        profileId: string,
    ): Promise<DashboardStats> {
        const today = new Date().toISOString().split("T")[0];

        // Determine visibility
        const isStaff = role === "super_admin" || role === "admin" ||
            role === "staff";

        const [
            studentsCount,
            teachersCount,
            classesCount,
            assignmentsCount,
            attendanceCount,
        ] = await Promise.all([
            // 1. Total Students
            this.supabase
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("role", "student"),

            // 2. Total Teachers
            this.supabase
                .from("profiles")
                .select("id", { count: "exact", head: true })
                .eq("role", "teacher"),

            // 3. Classes (role-based)
            isStaff
                ? this.supabase.from("classes").select("id", {
                    count: "exact",
                    head: true,
                })
                : this.supabase.from("classes").select("id", {
                    count: "exact",
                    head: true,
                }).eq("teacher_id", profileId),

            // 4. Assignments (role-based)
            this.getAssignmentCount(isStaff, profileId),

            // 5. Attendance Today
            this.supabase
                .from("attendance")
                .select("id", { count: "exact", head: true })
                .eq("date", today),
        ]);

        return {
            totalStudents: studentsCount.count || 0,
            totalTeachers: teachersCount.count || 0,
            totalClasses: classesCount.count || 0,
            totalAssignments: assignmentsCount.count || 0,
            attendanceToday: attendanceCount.count || 0,
        };
    }

    /**
     * Get recent system activity logs
     */
    async getRecentActivity(
        limit: number,
        role: UserRole,
        profileId: string,
    ): Promise<ActivityLog[]> {
        let query = this.supabase
            .from("audit_logs")
            .select(`
        id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles:user_id (full_name, avatar_url)
      `)
            .order("created_at", { ascending: false })
            .limit(limit);

        // Non-admin roles only see their own activity
        if (role !== "super_admin" && role !== "admin") {
            query = query.eq("user_id", profileId);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`Failed to fetch activity logs: ${error.message}`);
        }

        return (data || []).map((item: any) => ({
            ...item,
            full_name: item.profiles?.full_name || null,
            avatar_url: item.profiles?.avatar_url || null,
        }));
    }

    private async getAssignmentCount(
        isStaff: boolean,
        profileId: string,
    ): Promise<{ count: number }> {
        if (isStaff) {
            const { count } = await this.supabase
                .from("assignments")
                .select("id", { count: "exact", head: true });
            return { count: count || 0 };
        }

        // For teachers, we need to join through classes
        const { data: teacherClasses } = await this.supabase
            .from("classes")
            .select("id")
            .eq("teacher_id", profileId);

        const classIds = teacherClasses?.map((c: any) => c.id) || [];
        if (classIds.length === 0) return { count: 0 };

        const { count } = await this.supabase
            .from("assignments")
            .select("id", { count: "exact", head: true })
            .in("class_id", classIds);

        return { count: count || 0 };
    }
}
