import { supabase } from '../config/supabase';
import type { Course } from '../types';
import type { Database } from '../config/database';

export const courseService = {
  /**
   * Create a new course (teacher dashboard).
   */
  // Controller expects `create`
  async create(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
  const { data, error } = await (supabase.from('courses') as any)
    .insert([course])
    .select()
    .single();

    if (error) throw new Error(`Failed to create course: ${error.message}`);
    return data as Course;
  },

  /**
   * Update an existing course (teacher dashboard).
   */
  // Controller expects `update`
  async update(id: string, updates: Partial<Course>): Promise<Course> {
    const { data, error } = await (supabase.from('courses') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update course: ${error.message}`);
    return data as Course;
  },

  /**
   * Delete a course (teacher dashboard).
   */
  // Controller expects `delete`
  async delete(id: string): Promise<boolean> {
  const { error } = await supabase.from('courses').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete course: ${error.message}`);
    return true;
  },

  /**
   * Get a single course by ID (used in app or dashboard).
   */
  // Controller expects `getById`
  async getById(id: string): Promise<Course> {
  const { data, error } = await supabase.from('courses').select('*').eq('id', id).single();

    if (error) throw new Error(`Failed to fetch course: ${error.message}`);
    return data as Course;
  },

  /**
   * Get all published courses (for student app).
   */
  // Controller expects `getAll` for listing — return all courses (admins) by default
  async getAll(): Promise<Course[]> {
  const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
    return data || [];
  },

  /**
   * Get all courses created by a specific teacher (dashboard use).
   */
  async getCoursesByAuthor(author_id: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('author_id', author_id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch teacher's courses: ${error.message}`);
    return data || [];
  },

  /**
   * Publish or unpublish a course.
   */
  async setPublishStatus(id: string, is_published: boolean): Promise<Course> {
    const { data, error } = await (supabase.from('courses') as any)
      .update({ is_published, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to change publish status: ${error.message}`);
    return data as Course;
  },
};
