// src/db.ts
import { supabase } from './config/supabase';
import type { Course, Profile } from './types';

export const testConnection = async () => {
  try {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      console.error('Supabase ping error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('testConnection error:', err);
    return false;
  }
};

export const getCounts = async () => {
  try {
  const { count: users } = await supabase.from('profiles').select('id', { head: true, count: 'exact' });
    const { count: courses } = await supabase.from('courses').select('id', { head: true, count: 'exact' });
    const { count: lessons } = await supabase.from('lessons').select('id', { head: true, count: 'exact' });
    const { count: enrollments } = await supabase.from('enrollments').select('id', { head: true, count: 'exact' });
    return { users, courses, lessons, enrollments };
  } catch (err) {
    throw err;
  }
};
