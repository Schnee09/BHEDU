import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, PaginatedResult } from "./base";

export interface Teacher {
    id: string;
    user_id: string | null;
    email: string;
    full_name: string;
    role: "teacher" | "staff" | "tutor";
    phone: string | null;
    address: string | null;
    date_of_birth: string | null;
    is_active: boolean;
    teacher_type: "full_time" | "part_time" | "tutor";
    department: string | null;
    specialization: string | null;
    hourly_rate: number | null;
    class_count: number;
}

export interface TeacherFilters {
    search?: string;
    include_staff?: boolean;
    teacher_type?: "full_time" | "part_time" | "tutor" | "all";
    page?: number;
    limit?: number;
}

export class TeacherRepository extends BaseRepository<any, any, any> {
    protected readonly tableName = "profiles";
    protected readonly primaryKey = "id";

    constructor(supabase: SupabaseClient) {
        super(supabase);
    }

    /**
     * Find teachers with stats (class counts)
     */
    async findTeachersWithStats(
        filters: TeacherFilters = {},
    ): Promise<PaginatedResult<Teacher>> {
        const page = filters.page || 1;
        const pageSize = filters.limit || 20;
        const start = (page - 1) * pageSize;
        const end = start + pageSize - 1;

        const roles = filters.include_staff
            ? ["teacher", "staff", "tutor"]
            : ["teacher", "tutor"];

        let query = this.supabase
            .from(this.tableName)
            .select(
                `
        *,
        teacher_profiles (
          teacher_type,
          department,
          specialization
        )
      `,
                { count: "exact" },
            )
            .in("role", roles);

        if (filters.search) {
            query = query.or(
                `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
            );
        }

        if (filters.teacher_type && filters.teacher_type !== "all") {
            // Note: Supabase filtering on joined tables can be tricky in some versions
            // We might need to filter in JS if the RPC/View isn't available
            // But let's try the standard approach first
            query = query.filter(
                "teacher_profiles.teacher_type",
                "eq",
                filters.teacher_type,
            );
        }

        const { data, error, count } = await query
            .order("role", { ascending: true })
            .order("full_name", { ascending: true })
            .range(start, end);

        if (error) {
            throw new Error(`Failed to fetch teachers: ${error.message}`);
        }

        // Get class counts for each teacher
        const teachersWithStats = await Promise.all(
            (data || []).map(async (item: any) => {
                const { count: classCount } = await this.supabase
                    .from("classes")
                    .select("id", { count: "exact", head: true })
                    .eq("teacher_id", item.id);

                const profile = item.teacher_profiles?.[0] || {};

                return {
                    ...item,
                    ...profile,
                    class_count: classCount || 0,
                } as Teacher;
            }),
        );

        return {
            data: teachersWithStats,
            total: count || 0,
            page,
            pageSize,
            totalPages: Math.ceil((count || 0) / pageSize),
        };
    }

    /**
     * Find a single teacher with their classes
     */
    async findDetailById(id: string) {
        const { data: teacher, error } = await this.supabase
            .from(this.tableName)
            .select(`
        *,
        teacher_profiles (*)
      `)
            .eq("id", id)
            .single();

        if (error || !teacher) return null;

        const { data: classes } = await this.supabase
            .from("classes")
            .select(`
        *,
        academic_year:academic_years(id, name, status),
        enrollments:enrollments(count)
      `)
            .eq("teacher_id", id)
            .order("academic_year_id", { ascending: false });

        const activeClasses = (classes || []).filter((c) =>
            c.status === "active"
        );
        const totalStudents = (classes || []).reduce((sum, cls) => {
            const count = (cls.enrollments as any)?.[0]?.count || 0;
            return sum + count;
        }, 0);

        return {
            ...teacher,
            teacher_profile: teacher.teacher_profiles?.[0] || null,
            classes: classes || [],
            statistics: {
                total_classes: classes?.length || 0,
                active_classes: activeClasses.length,
                total_students: totalStudents,
            },
        };
    }
}
