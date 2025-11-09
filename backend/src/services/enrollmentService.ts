// src/services/enrollmentService.ts
import { supabase } from '../config/supabase';
import type { Enrollment } from '../types';
import type { Database } from '../config/database';
export const enrollmentService = {
  async enroll(user_id: string, course_id: string) {
    const { data, error } = await (supabase.from('enrollments') as any)
      .upsert([{ user_id, course_id }], { onConflict: 'user_id,course_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async unenroll(user_id: string, course_id: string) {
    const { error } = await supabase.from('enrollments')
      .delete()
      .match({ user_id, course_id });

    if (error) throw error;
    return true;
  },

  async getUserEnrollments(user_id: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        progress,
        status,
        enrolled_at,
        course_id,
        courses (
          id,
          title,
          description,
          thumbnail,
          author_id
        )
      `)
      .eq('user_id', user_id)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCourseEnrollments(course_id: string) {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        progress,
        status,
        enrolled_at,
        user_id,
        users (
          id,
          email,
          full_name,
          role
        )
      `)
      .eq('course_id', course_id)
      .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async updateProgress(user_id: string, course_id: string, progress: number) {
    const { data, error } = await (supabase.from('enrollments') as any)
      .update({ progress, updated_at: new Date().toISOString() })
      .match({ user_id, course_id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getEnrollmentById(id: string) {
    const { data, error } = await supabase.from('enrollments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getEnrollment(user_id: string, course_id: string) {
    const { data, error } = await supabase.from('enrollments')
      .select('*')
      .match({ user_id, course_id })
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
