// src/services/lessonService.ts
import { supabase } from '../config/supabase';
import type { Lesson } from '../types';

export const lessonService = {
  async createLesson(payload: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await (supabase.from('lessons') as any)
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Lesson;
  },

  async updateLesson(id: string, updates: Partial<Lesson>) {
    const { data, error } = await (supabase.from('lessons') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Lesson;
  },

  async deleteLesson(id: string) {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  async getLessonsByCourse(course_id: string, onlyPublished = false) {
    let q: any = supabase.from('lessons').select('*').eq('course_id', course_id).order('order_index', { ascending: true });
    if (onlyPublished) q = q.eq('is_published', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data as Lesson[];
  },

  async getLessonById(id: string) {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as Lesson;
  },

  async setPublish(id: string, is_published: boolean) {
    const { data, error } = await (supabase.from('lessons') as any)
      .update({ is_published, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Lesson;
  }
};
