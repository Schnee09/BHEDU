/**
 * Course Service - Business logic for course management
 */

import { createClient } from '@/lib/supabase/server';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import type { CreateCourseInput, UpdateCourseInput } from '@/lib/api/schemas';

export interface Course {
  id: string;
  name: string;
  description: string | null;
  code: string;
  subject_id: string;
  credits: number | null;
  created_at: string;
  updated_at: string;
}

export class CourseService {
  /**
   * Get all courses with optional filters
   */
  static async getCourses(filters?: {
    subjectId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const supabase = await createClient();
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('courses')
      .select('*, subjects(id, name)', { count: 'exact' });

    // Apply filters
    if (filters?.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }

    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    // Pagination
    query = query.range(offset, offset + pageSize - 1).order('name');

    const { data, error, count } = await query;

    if (error) {
      console.error('Failed to fetch courses:', error);
      throw new Error('Failed to fetch courses');
    }

    return {
      courses: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  }

  /**
   * Get a single course by ID
   */
  static async getCourseById(id: string): Promise<Course> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*, subjects(id, name)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError('Course not found');
    }

    return data;
  }

  /**
   * Create a new course
   */
  static async createCourse(input: CreateCourseInput) {
    const supabase = await createClient();

    // Check if course code already exists
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('code', input.code)
      .single();

    if (existing) {
      throw new ValidationError('Course code already exists');
    }

    // Check if subject exists
    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', input.subject_id)
      .single();

    if (!subject) {
      throw new ValidationError('Subject not found');
    }

    const { data, error } = await supabase
      .from('courses')
      .insert({
        name: input.name,
        description: input.description || null,
        code: input.code,
        subject_id: input.subject_id,
        credits: input.credits || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create course:', error);
      throw new Error('Failed to create course');
    }

    return data;
  }

  /**
   * Update a course
   */
  static async updateCourse(id: string, input: UpdateCourseInput) {
    const supabase = await createClient();

    // Check if course exists
    await this.getCourseById(id);

    // If updating code, check for duplicates
    if (input.code) {
      const { data: existing } = await supabase
        .from('courses')
        .select('id')
        .eq('code', input.code)
        .neq('id', id)
        .single();

      if (existing) {
        throw new ValidationError('Course code already exists');
      }
    }

    // If updating subject, verify it exists
    if (input.subject_id) {
      const { data: subject } = await supabase
        .from('subjects')
        .select('id')
        .eq('id', input.subject_id)
        .single();

      if (!subject) {
        throw new ValidationError('Subject not found');
      }
    }

    const { data, error } = await supabase
      .from('courses')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update course:', error);
      throw new Error('Failed to update course');
    }

    return data;
  }

  /**
   * Delete a course
   */
  static async deleteCourse(id: string) {
    const supabase = await createClient();

    // Check if course exists
    await this.getCourseById(id);

    // Check if course has any classes
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .eq('course_id', id)
      .limit(1);

    if (classes && classes.length > 0) {
      throw new ValidationError('Cannot delete course with existing classes');
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete course:', error);
      throw new Error('Failed to delete course');
    }
  }

  /**
   * Get courses by subject
   */
  static async getCoursesBySubject(subjectId: string) {
    return this.getCourses({ subjectId });
  }
}
