import { supabase } from '../config/supabase';

export type Course = {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  author_id: string;
  created_at?: string;
  updated_at?: string;
  is_published?: boolean;
};

export const courseService = {
  /**
   * Create a new course (teacher dashboard).
   */
  async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    const { data, error } = await supabase
      .from<unknown, Course>('courses')
      .insert(course)
      .select()
      .single();

    if (error) throw new Error(`Failed to create course: ${error.message}`);
    return data;
  },

  /**
   * Update an existing course (teacher dashboard).
   */
  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase
      .from<unknown, Course>('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update course: ${error.message}`);
    return data;
  },

  /**
   * Delete a course (teacher dashboard).
   */
  async deleteCourse(id: string): Promise<boolean> {
    const { error } = await supabase.from<unknown, Course>('courses').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete course: ${error.message}`);
    return true;
  },

  /**
   * Get a single course by ID (used in app or dashboard).
   */
  async getCourseById(id: string): Promise<Course> {
    const { data, error } = await supabase
      .from<unknown, Course>('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch course: ${error.message}`);
    return data;
  },

  /**
   * Get all published courses (for student app).
   */
  async getPublishedCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from<unknown, Course>('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch courses: ${error.message}`);
    return data || [];
  },

  /**
   * Get all courses created by a specific teacher (dashboard use).
   */
  async getCoursesByAuthor(author_id: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from<unknown, Course>('courses')
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
    const { data, error } = await supabase
      .from<unknown, Course>('courses')
      .update({ is_published, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to change publish status: ${error.message}`);
    return data;
  },
};
