// src/services/lessonService.ts
import { supabase } from '../config/supabase';

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  content?: string;
  video_url?: string;
  order_index?: number;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
};

export const lessonService = {
  async createLesson(payload: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from<unknown, Lesson>('lessons')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateLesson(id: string, updates: Partial<Lesson>) {
    const { data, error } = await supabase
      .from<unknown, Lesson>('lessons')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteLesson(id: string) {
    const { error } = await supabase.from<unknown, Lesson>('lessons').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  },

  async getLessonsByCourse(course_id: string, onlyPublished = false) {
    let q = supabase.from<unknown, Lesson>('lessons').select('*').eq('course_id', course_id).order('order_index', { ascending: true });
    if (onlyPublished) q = q.eq('is_published', true);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return data as Lesson[];
  },

  async getLessonById(id: string) {
    const { data, error } = await supabase
      .from<unknown, Lesson>('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data as Lesson;
  },

  async setPublish(id: string, is_published: boolean) {
    const { data, error } = await supabase
      .from<unknown, Lesson>('lessons')
      .update({ is_published, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Lesson;
  }
};
