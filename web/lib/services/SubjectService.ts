/**
 * SubjectService
 * 
 * CRUD operations for curriculum subjects.
 */

import { createServiceClient } from '@/lib/supabase/server';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  description?: string;
  credits?: number;
}

export interface UpdateSubjectInput {
  name?: string;
  code?: string;
  description?: string;
  credits?: number;
  isActive?: boolean;
}

export interface SubjectListOptions {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class SubjectService {
  private supabase;

  constructor() {
    this.supabase = createServiceClient();
  }

  /**
   * Get all subjects with optional filters
   */
  async getSubjects(options: SubjectListOptions = {}): Promise<{ subjects: Subject[]; total: number }> {
    const { search, isActive, page = 1, limit = 100 } = options;

    let query = this.supabase
      .from('subjects')
      .select('id, name, code, description, credits, is_active, created_at, updated_at', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1).order('name');

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch subjects: ${error.message}`);
    }

    const subjects: Subject[] = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      description: s.description,
      credits: s.credits,
      isActive: s.is_active,
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
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch subject: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      credits: data.credits,
      isActive: data.is_active,
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
      .from('subjects')
      .select('id')
      .eq('code', input.code.toUpperCase())
      .single();

    if (existing) {
      throw new Error(`Môn học với mã "${input.code}" đã tồn tại`);
    }

    const { data, error } = await this.supabase
      .from('subjects')
      .insert({
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description,
        credits: input.credits,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create subject: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      credits: data.credits,
      isActive: data.is_active,
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
    if (input.description !== undefined) updateData.description = input.description;
    if (input.credits !== undefined) updateData.credits = input.credits;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await this.supabase
      .from('subjects')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to update subject: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      code: data.code,
      description: data.description,
      credits: data.credits,
      isActive: data.is_active,
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
      .from('grades')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', id);

    if (gradeCount && gradeCount > 0 && hardDelete) {
      throw new Error(`Không thể xóa môn học có ${gradeCount} bản ghi điểm`);
    }

    if (hardDelete) {
      const { error } = await this.supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete subject: ${error.message}`);
      }
    } else {
      // Soft delete
      await this.updateSubject(id, { isActive: false });
    }
  }
}
