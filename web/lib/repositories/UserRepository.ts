import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository, PaginatedResult } from "./base";
import { getDisplayName } from "@/lib/utils/names";
import {
  type CreateUserInput,
  type UpdateUserInput,
  type User,
  type UserQueryInput,
} from "@/lib/schemas";

export { type UserQueryInput };

export class UserRepository extends BaseRepository<
  User,
  CreateUserInput,
  UpdateUserInput
> {
  protected readonly tableName = "profiles";
  protected readonly primaryKey = "id";
  protected override readonly useSoftDelete = true;

  constructor(supabase: SupabaseClient) {
    super(supabase);
  }

  /**
   * Find all users with advanced filtering
   */
  async findAll(
    filters: Partial<UserQueryInput> = {},
  ): Promise<PaginatedResult<User>> {
    const page = filters.page || 1;
    const pageSize = filters.limit || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    let query = this.supabase
      .from(this.tableName)
      .select("*", { count: "exact" });

    if (this.useSoftDelete && typeof (query as any).is === "function") {
      query = query.is("deleted_at", null);
    }

    // Apply sorting
    if (filters.sort) {
      query = query.order(filters.sort, {
        ascending: filters.order === "asc",
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // Apply Filters
    if (filters.role && filters.role !== "all") {
      if (filters.role === "instructors" || filters.role === "class_teachers") {
        query = query.in("role", ["teacher", "admin", "owner", "super_admin"]);
      } else if (filters.role === "tutoring_staff" || filters.role === "tutors") {
        query = query.in("role", ["tutor", "teacher", "admin", "owner", "super_admin"]);
      } else if (filters.role.includes(",")) {
        const roles = filters.role.split(",").map((r: string) => r.trim()).filter(Boolean);
        query = query.in("role", roles);
      } else {
        query = query.eq("role", filters.role);
      }
    }

    if (filters.status && filters.status !== "all") {
      if (filters.status === "active") {
        query = query.eq("is_active", true);
      } else if (filters.status === "inactive") {
        query = query.eq("is_active", false);
      }
    }

    if (filters.is_active === true || filters.is_active === false) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.department) {
      query = query.eq("department", filters.department);
    }

    if (filters.search) {
      // Search email, full_name, phone, student_code, teacher_code
      query = query.or(
        `email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,student_code.ilike.%${filters.search}%,teacher_code.ilike.%${filters.search}%`
      );
    }

    const { data, error, count } = await query
      .range(start, end);

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return {
      data: (data || []).map((u) => ({
        ...u,
        full_name: getDisplayName(u),
      })) as User[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  /**
   * Get user statistics
   */
  async getStatistics() {
    // Try RPC first
    const { data: rpcStats, error: rpcError } = await this.supabase.rpc(
      "get_user_statistics",
    ).single();

    if (!rpcError && rpcStats) {
      return rpcStats;
    }

    // Fallback: Fetch count & role distributions directly
    let query = this.supabase.from(this.tableName).select("role, is_active, created_at");
    if (this.useSoftDelete) {
      query = query.is("deleted_at", null);
    }
    const { data: rows } = await query;

    let total = 0;
    let active = 0;
    let student_count = 0;
    let teacher_count = 0;
    let tutor_count = 0;
    let parent_count = 0;
    let admin_count = 0;
    let recent_signups = 0;

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    if (rows) {
      total = rows.length;
      for (const u of rows) {
        if (u.is_active !== false) active++;
        if (u.role === 'student') student_count++;
        else if (u.role === 'teacher') teacher_count++;
        else if (u.role === 'tutor') tutor_count++;
        else if (u.role === 'parent') parent_count++;
        else if (u.role === 'admin' || u.role === 'super_admin' || u.role === 'owner') admin_count++;

        if (u.created_at && u.created_at >= oneWeekAgo) recent_signups++;
      }
    }

    return {
      total_users: total,
      active_users: active,
      inactive_users: total - active,
      student_count,
      teacher_count,
      tutor_count,
      parent_count,
      admin_count,
      recent_signups,
    };
  }
}
