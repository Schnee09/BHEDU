import { createServiceClient } from "@/lib/supabase/server";
import { ConflictError, ValidationError } from "@/lib/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  credits?: number;
  is_active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  description?: string | null;
  credits?: number;
  is_active?: boolean;
}

export interface UpdateSubjectInput {
  name?: string;
  code?: string;
  description?: string | null;
  credits?: number;
  is_active?: boolean;
}

export interface SubjectListOptions {
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export class SubjectService {
  private supabase: SupabaseClient;

  /**
   * @param supabase - Optional Supabase client for dependency injection (testing)
   */
  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Get all subjects with optional filters
   */
  async getSubjects(
    options: SubjectListOptions = {},
  ): Promise<{ subjects: Subject[]; total: number }> {
    const { search, is_active, page = 1, limit = 100 } = options;

    let query = this.supabase
      .from("subjects")
      .select(
        "id, name, code, description, credits, is_active, created_at, updated_at",
        { count: "exact" },
      );

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    if (is_active !== undefined) {
      query = query.eq("is_active", is_active);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order("name");

    const { data, count, error } = await query;

    if (error) {
      throw error;
    }

    const subjects: Subject[] = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      credits: s.credits,
      is_active: s.is_active,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    return { subjects, total: count || 0 };
  }

  /**
   * Get a single subject by ID
   */
  async getSubjectById(id: string): Promise<Subject | null> {
    const { data, error } = await this.supabase
      .from("subjects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      credits: data.credits,
      is_active: data.is_active !== undefined ? data.is_active : true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Create a new subject
   */
  async createSubject(input: CreateSubjectInput): Promise<Subject> {
    // Check for duplicate code
    const { data: existing } = await this.supabase
      .from("subjects")
      .select("id")
      .eq("code", input.code.toUpperCase())
      .maybeSingle();

    if (existing) {
      throw new ConflictError(`Môn học với mã "${input.code}" đã tồn tại`);
    }

    const { data, error } = await this.supabase
      .from("subjects")
      .insert({
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description,
        credits: input.credits,
        is_active: input.is_active !== undefined ? input.is_active : true,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      credits: data.credits,
      is_active: data.is_active,
      createdAt: data.created_at,
    };
  }

  /**
   * Update a subject
   */
  async updateSubject(id: string, input: UpdateSubjectInput): Promise<Subject> {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code.toUpperCase();
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.credits !== undefined) updateData.credits = input.credits;
    if (input.is_active !== undefined) updateData.is_active = input.is_active;

    const { data, error } = await this.supabase
      .from("subjects")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      is_active: input.is_active ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Delete a subject (soft delete by setting is_active = false)
   */
  async deleteSubject(id: string, hardDelete = false): Promise<void> {
    // Check for grades using this subject
    const { count: gradeCount } = await this.supabase
      .from("grades")
      .select("*", { count: "exact", head: true })
      .eq("subject_id", id);

    if (gradeCount && gradeCount > 0 && !hardDelete) {
      throw new ValidationError(
        `Không thể xóa môn học có ${gradeCount} bản ghi điểm`,
      );
    }

    if (hardDelete) {
      // 1. Delete related grades
      if (gradeCount && gradeCount > 0) {
        await this.supabase.from("grades").delete().eq("subject_id", id);
      }

      // 2. Delete related timetable slots
      await this.supabase.from("timetable_slots").delete().eq("subject_id", id);

      // 3. Delete the subject
      const { error } = await this.supabase
        .from("subjects")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }
    } else {
      // Soft delete
      await this.updateSubject(id, { is_active: false });
    }
  }

  // ============================================================
  // STATIC METHODS FOR BACKWARD COMPATIBILITY
  // ============================================================

  static async getSubjects(options?: SubjectListOptions) {
    return subjectService.getSubjects(options);
  }

  static async getSubjectById(id: string) {
    return subjectService.getSubjectById(id);
  }

  static async createSubject(input: CreateSubjectInput) {
    return subjectService.createSubject(input);
  }

  static async updateSubject(id: string, input: UpdateSubjectInput) {
    return subjectService.updateSubject(id, input);
  }

  static async deleteSubject(id: string, hardDelete = false) {
    return subjectService.deleteSubject(id, hardDelete);
  }
}

// Default singleton instance
export const subjectService = new SubjectService();
