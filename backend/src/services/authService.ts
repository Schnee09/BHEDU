// src/services/authService.ts
import { supabase } from '../config/supabase';

export const authService = {
  // Create user (server-side). Uses service role key so can set role metadata etc.
  async register(email: string, password: string, full_name?: string, role?: string) {
    // Using admin create user would be ideal (createUser), but signUp also returns user+session.
    // With service role key we can use admin API:
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name, role }
    });

    if (error) throw new Error(error.message);

    // Ensure a row exists in profiles (profiles.full_name and role are NOT NULL)
    const user = data.user;
    if (user?.id) {
      const fallbackName = full_name || (email?.split('@')[0] ?? 'User');
      const fallbackRole = (role as any) || 'student';
      const { error: profileErr } = await (supabase as any)
        .from('profiles')
        .upsert({ id: user.id, full_name: fallbackName, role: fallbackRole })
        .select()
        .single();
      if (profileErr) throw new Error(`profile upsert failed: ${profileErr.message}`);
    }

    return user;
  },

  // Sign in (server-side proxy). Typically frontend calls Supabase client directly.
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    // return session object that contains access_token
    return data;
  },

  // Get user object from access token (Bearer)
  async getUserFromToken(token: string) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw new Error(error.message);
    return data.user;
  },

  // Server side sign out (invalidate session) - optional
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return true;
  }
};
