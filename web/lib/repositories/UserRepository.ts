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
      query = query.eq("role", filters.role);
    }

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status); // Check if 'status' column exists or mapped from is_active?
      // Note: profiles usually have 'is_active'. 'status' might be a derived field or new column?
      // Based on common.ts, userRoleSchema etc.
      // If status is 'active'/'inactive', we might need to map to is_active boolean if 'status' column doesn't exist.
    }

    // If 'status' column doesn't exist, we might map logical status
    if (filters.is_active === true || filters.is_active === false) {
      query = query.eq("is_active", filters.is_active);
    }

    if (filters.department) {
      query = query.eq("department", filters.department);
    }

    if (filters.search) {
      // Search email or full_name
      query = query.or(
        `email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`,
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

    // Fallback if RPC fails
    const { count: total } = await this.supabase.from(this.tableName).select(
      "*",
      { count: "exact", head: true },
    );
    const { count: active } = await this.supabase.from(this.tableName).select(
      "*",
      { count: "exact", head: true },
    ).eq("is_active", true);

    return {
      total_users: total || 0,
      active_users: active || 0,
      inactive_users: (total || 0) - (active || 0),
      recent_signups: 0,
    };
  }
}
