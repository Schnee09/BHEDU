/**
 * Student Request Repository - Data access layer for student requests
 * Supports Leave of Absence, Makeup Class, Class Transfer, Deferral
 */

import { createServiceClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type RequestType = 'leave_absence' | 'makeup_class' | 'class_transfer' | 'deferral';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface StudentRequest {
  id: string;
  student_id: string;
  parent_id?: string | null;
  request_type: RequestType;
  class_id?: string | null;
  target_class_id?: string | null;
  request_date?: string | null;
  end_date?: string | null;
  reason: string;
  status: RequestStatus;
  reviewer_id?: string | null;
  reviewer_note?: string | null;
  reviewed_at?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    student_code?: string;
    student_id?: string;
  };
  parent?: {
    id: string;
    full_name: string;
  };
  class?: {
    id: string;
    name: string;
  };
  target_class?: {
    id: string;
    name: string;
  };
  reviewer?: {
    id: string;
    full_name: string;
  };
}

export interface CreateRequestInput {
  student_id: string;
  parent_id?: string | null;
  request_type: RequestType;
  class_id?: string | null;
  target_class_id?: string | null;
  request_date?: string | null;
  end_date?: string | null;
  reason: string;
  metadata?: Record<string, any>;
}

export interface ReviewRequestInput {
  status: 'approved' | 'rejected' | 'cancelled';
  reviewer_id: string;
  reviewer_note?: string | null;
}

export class StudentRequestRepository {
  private supabase: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.supabase = supabase || createServiceClient();
  }

  /**
   * Retrieves requests with optional filters
   */
  async findRequests(filters: {
    student_id?: string;
    class_id?: string;
    status?: string;
    request_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: StudentRequest[]; total: number }> {
    try {
      let query = this.supabase
        .from('student_requests')
        .select(
          `
          *,
          student:profiles!student_requests_student_id_fkey(id, full_name, student_code, student_id),
          parent:profiles!student_requests_parent_id_fkey(id, full_name),
          class:classes!student_requests_class_id_fkey(id, name),
          target_class:classes!student_requests_target_class_id_fkey(id, name),
          reviewer:profiles!student_requests_reviewer_id_fkey(id, full_name)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      if (filters.student_id) {
        query = query.eq('student_id', filters.student_id);
      }
      if (filters.class_id) {
        query = query.eq('class_id', filters.class_id);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.request_type && filters.request_type !== 'all') {
        query = query.eq('request_type', filters.request_type);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        // If table doesn't exist yet, return empty list gracefully
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return { data: [], total: 0 };
        }
        console.error('Error finding student requests:', error);
        return { data: [], total: 0 };
      }

      return {
        data: (data as any[]) || [],
        total: count || 0,
      };
    } catch (err) {
      console.error('Unexpected error finding student requests:', err);
      return { data: [], total: 0 };
    }
  }

  /**
   * Find a single request by ID
   */
  async findById(id: string): Promise<StudentRequest | null> {
    try {
      const { data, error } = await this.supabase
        .from('student_requests')
        .select(
          `
          *,
          student:profiles!student_requests_student_id_fkey(id, full_name, student_code, student_id),
          parent:profiles!student_requests_parent_id_fkey(id, full_name),
          class:classes!student_requests_class_id_fkey(id, name),
          target_class:classes!student_requests_target_class_id_fkey(id, name),
          reviewer:profiles!student_requests_reviewer_id_fkey(id, full_name)
        `
        )
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data as any;
    } catch (err) {
      console.error('Error in findById:', err);
      return null;
    }
  }

  /**
   * Creates a new student request
   */
  async create(input: CreateRequestInput): Promise<StudentRequest | null> {
    try {
      const { data, error } = await this.supabase
        .from('student_requests')
        .insert({
          student_id: input.student_id,
          parent_id: input.parent_id || null,
          request_type: input.request_type,
          class_id: input.class_id || null,
          target_class_id: input.target_class_id || null,
          request_date: input.request_date || null,
          end_date: input.end_date || null,
          reason: input.reason,
          status: 'pending',
          metadata: input.metadata || {},
        })
        .select(
          `
          *,
          student:profiles!student_requests_student_id_fkey(id, full_name, student_code, student_id),
          class:classes!student_requests_class_id_fkey(id, name)
        `
        )
        .single();

      if (error) {
        console.error('Error creating student request:', error);
        throw new Error(error.message);
      }

      return data as any;
    } catch (err: any) {
      console.error('Unexpected error creating student request:', err);
      throw err;
    }
  }

  /**
   * Updates request review status (approve/reject)
   */
  async updateStatus(id: string, review: ReviewRequestInput): Promise<StudentRequest | null> {
    try {
      const { data, error } = await this.supabase
        .from('student_requests')
        .update({
          status: review.status,
          reviewer_id: review.reviewer_id,
          reviewer_note: review.reviewer_note || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(
          `
          *,
          student:profiles!student_requests_student_id_fkey(id, full_name, student_code, student_id),
          class:classes!student_requests_class_id_fkey(id, name),
          reviewer:profiles!student_requests_reviewer_id_fkey(id, full_name)
        `
        )
        .single();

      if (error) {
        console.error('Error updating student request status:', error);
        throw new Error(error.message);
      }

      return data as any;
    } catch (err: any) {
      console.error('Unexpected error updating request status:', err);
      throw err;
    }
  }
}

export const studentRequestRepository = new StudentRequestRepository();
