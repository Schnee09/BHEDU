/**
 * Audit Service - Logs user actions for tracking and compliance
 */

import { createClient } from "@/lib/supabase/server";

export type AuditAction = 
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "view"
  | "export"
  | "import"
  | "bulk_update"
  | "bulk_delete";

export type ResourceType =
  | "student"
  | "teacher"
  | "class"
  | "grade"
  | "attendance"
  | "enrollment"
  | "user"
  | "profile"
  | "settings"
  | "report"
  | "backup";

export interface AuditLogEntry {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit entry
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId || null,
      old_data: entry.oldData || null,
      new_data: entry.newData || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    });

    if (error) {
      console.error("Failed to create audit log:", error);
    }
  } catch (err) {
    console.error("Audit logging error:", err);
  }
}

/**
 * Get audit logs with pagination and filtering
 */
export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  resourceType?: ResourceType;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  data: AuditLog[];
  count: number;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (options?.action) {
      query = query.eq("action", options.action);
    }
    if (options?.resourceType) {
      query = query.eq("resource_type", options.resourceType);
    }
    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }
    if (options?.startDate) {
      query = query.gte("created_at", options.startDate.toISOString());
    }
    if (options?.endDate) {
      query = query.lte("created_at", options.endDate.toISOString());
    }

    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      data: (data as AuditLog[]) || [],
      count: count || 0,
      error: null,
    };
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err as Error,
    };
  }
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Action labels in Vietnamese
export const actionLabels: Record<AuditAction, string> = {
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Xóa",
  login: "Đăng nhập",
  logout: "Đăng xuất",
  view: "Xem",
  export: "Xuất dữ liệu",
  import: "Nhập dữ liệu",
  bulk_update: "Cập nhật hàng loạt",
  bulk_delete: "Xóa hàng loạt",
};

// Resource type labels in Vietnamese
export const resourceLabels: Record<ResourceType, string> = {
  student: "Học sinh",
  teacher: "Giáo viên",
  class: "Lớp học",
  grade: "Điểm số",
  attendance: "Điểm danh",
  enrollment: "Đăng ký",
  user: "Người dùng",
  profile: "Hồ sơ",
  settings: "Cài đặt",
  report: "Báo cáo",
  backup: "Sao lưu",
};
