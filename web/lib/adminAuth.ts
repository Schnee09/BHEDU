// web/lib/adminAuth.ts
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Server-side check for admin access.
 * Call this at the top of any admin page or server action.
 * Returns the admin profile or redirects to unauthorized.
 */
type ProfileRecord = { id: string; full_name?: string; role?: string };

export async function requireAdmin() {
  const supabase = await createClient();
  
  // Use getUser() instead of getSession() for security (authenticates with Auth server)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    redirect('/login?redirectTo=/admin');
  }

  // Fetch profile to check role (using anon key with RLS)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/unauthorized');
  }

  const p = profile as ProfileRecord;
  if (p.role !== 'admin') {
    redirect('/unauthorized');
  }

  return p;
}

/**
 * Check if the current user has admin role (returns boolean, doesn't redirect).
 * Useful for conditional rendering.
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  
  // Use getUser() instead of getSession() for security
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return (profile as ProfileRecord | null)?.role === 'admin';
}

