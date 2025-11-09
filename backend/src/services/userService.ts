import { supabase } from '../config/supabase';
import type { Profile } from '../types';

const sb: any = supabase;

export type UserProfile = Partial<Profile> & { id: string };

export const userService = {
  async getAll() {
  const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as UserProfile[];
  },

  async getById(id: string) {
  const { data, error } = await sb.from('profiles').select('*').eq('id', id).single();
    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async create(profile: Partial<UserProfile>) {
  const { data, error } = await sb.from('profiles').insert(profile as any).select().single();
    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async update(id: string, updates: Partial<UserProfile>) {
    const { data, error } = await sb
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async delete(id: string) {
  const { error } = await sb.from('profiles').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
};
