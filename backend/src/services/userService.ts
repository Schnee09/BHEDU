import { supabase } from '../config/supabase';

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  role?: string; // "student" | "teacher" | "admin"
  created_at?: string;
  updated_at?: string;
};

export const userService = {
  async getAll() {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as UserProfile[];
  },

  async getById(id: string) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async create(profile: Partial<UserProfile>) {
    const { data, error } = await supabase.from('users').insert(profile).select().single();
    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async update(id: string, updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async delete(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
};
