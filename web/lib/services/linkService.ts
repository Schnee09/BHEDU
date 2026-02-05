/**
 * Link Service - Business logic for parent-student relationship management
 *
 * Adheres to v5.0 Instance-based service pattern.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { NotFoundError, ValidationError } from "@/lib/api/errors";
import type {
    ParentStudentLinkInput,
    UpdateLinkStatusInput,
} from "@/lib/schemas";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ParentStudentLink {
    id: string;
    parent_id: string;
    student_id: string;
    relationship: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    updated_at: string;
    parent?: {
        full_name: string;
        email: string | null;
        phone: string | null;
    };
    student?: {
        full_name: string;
        student_code: string;
    };
}

export class LinkService {
    private supabase: SupabaseClient;

    constructor(supabase?: SupabaseClient) {
        this.supabase = supabase || createServiceClient();
    }

    /**
     * List all parent-student links with optional filters
     */
    async getLinks(filters?: {
        status?: string;
        parentId?: string;
        studentId?: string;
        page?: number;
        pageSize?: number;
    }) {
        const page = filters?.page || 1;
        const pageSize = filters?.pageSize || 20;
        const offset = (page - 1) * pageSize;

        let query = this.supabase
            .from("parent_student_links")
            .select(
                `
        *,
        parent:profiles!parent_student_links_parent_id_fkey (
          full_name,
          email,
          phone
        ),
        student:profiles!parent_student_links_student_id_fkey (
          full_name,
          student_code
        )
      `,
                { count: "exact" },
            );

        if (filters?.status && filters.status !== "all") {
            query = query.eq("status", filters.status);
        }

        if (filters?.parentId) {
            query = query.eq("parent_id", filters.parentId);
        }

        if (filters?.studentId) {
            query = query.eq("student_id", filters.studentId);
        }

        query = query.range(offset, offset + pageSize - 1).order("created_at", {
            ascending: false,
        });

        const { data, error, count } = await query;

        if (error) {
            console.error("Failed to fetch links:", error);
            throw new Error("Failed to fetch parent-student links");
        }

        return {
            links: (data as any) as ParentStudentLink[],
            total: count || 0,
            page,
            pageSize,
        };
    }

    /**
     * Request a new link between parent and student
     */
    async requestLink(input: ParentStudentLinkInput) {
        // Check if link already exists
        const { data: existing } = await this.supabase
            .from("parent_student_links")
            .select("id, status")
            .eq("parent_id", input.parent_id)
            .eq("student_id", input.student_id)
            .single();

        if (existing) {
            if (existing.status === "pending") {
                throw new ValidationError("Yêu cầu kết nối đang chờ xử lý.");
            }
            if (existing.status === "approved") {
                throw new ValidationError("Tài khoản đã được kết nối.");
            }
            // If rejected, allow re-requesting? (Assuming yes, updates to pending)
            const { data, error } = await this.supabase
                .from("parent_student_links")
                .update({
                    status: "pending",
                    relationship: input.relationship,
                    created_at: new Date().toISOString(), // Reset request time
                })
                .eq("id", existing.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        const { data, error } = await this.supabase
            .from("parent_student_links")
            .insert({
                parent_id: input.parent_id,
                student_id: input.student_id,
                relationship: input.relationship,
                status: input.status || "pending",
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to create link:", error);
            throw new Error("Không thể gửi yêu cầu kết nối");
        }

        return data;
    }

    /**
     * Update link status (approve/reject)
     */
    async updateLinkStatus(input: UpdateLinkStatusInput) {
        const { data, error } = await this.supabase
            .from("parent_student_links")
            .update({ status: input.status })
            .eq("id", input.id)
            .select(`
        *,
        parent:profiles!parent_student_links_parent_id_fkey (full_name, email),
        student:profiles!parent_student_links_student_id_fkey (full_name)
      `)
            .single();

        if (error) {
            console.error("Failed to update link status:", error);
            throw new Error("Không thể cập nhật trạng thái kết nối");
        }

        if (!data) {
            throw new NotFoundError("Không tìm thấy yêu cầu kết nối");
        }

        return data;
    }

    /**
     * Get students linked to a specific parent
     */
    async getLinkedStudents(parentId: string) {
        const { data, error } = await this.supabase
            .from("parent_student_links")
            .select(`
        student:profiles!parent_student_links_student_id_fkey (
          id,
          full_name,
          student_code,
          grade_level
        )
      `)
            .eq("parent_id", parentId)
            .eq("status", "approved");

        if (error) {
            console.error("Failed to fetch linked students:", error);
            throw new Error("Không thể tải danh sách học sinh liên kết");
        }

        return data.map((item) => item.student);
    }

    // ============================================================
    // STATIC METHODS FOR BACKWARD COMPATIBILITY
    // ============================================================

    static async getLinks(filters?: Parameters<LinkService["getLinks"]>[0]) {
        return linkService.getLinks(filters);
    }

    static async requestLink(input: ParentStudentLinkInput) {
        return linkService.requestLink(input);
    }

    static async updateLinkStatus(input: UpdateLinkStatusInput) {
        return linkService.updateLinkStatus(input);
    }

    static async getLinkedStudents(parentId: string) {
        return linkService.getLinkedStudents(parentId);
    }
}

export const linkService = new LinkService();
