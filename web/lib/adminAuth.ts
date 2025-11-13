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
  
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    redirect('/login?redirectTo=/admin');
  }

  const user = session.user;

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
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  return (profile as ProfileRecord | null)?.role === 'admin';
}

