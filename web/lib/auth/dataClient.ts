import { createClient, createServiceClient, createClientFromRequest } from '@/lib/supabase/server';

/**
 * Returns a Supabase client suitable for the current request/viewer.
 * - If the current viewer is an admin (based on profiles.role) this will
 *   return a service-role client that bypasses RLS so admin pages can see
 *   all rows.
 * - Otherwise it returns the cookie-aware server client (bound to the
 *   incoming request/session) so RLS and row-level permissions apply.
 *
 * The function also returns the detected viewer role and the user id so
 * callers can adapt UI/permissions accordingly.
 */
export async function getDataClient(request?: Request) {
  // Use a request-bound client when available (API routes). Otherwise use
  // the cookie-aware server client for server components.
  const authClient = request ? createClientFromRequest(request) : await createClient();
  const { data: auth } = await authClient.auth.getUser();
  const user = auth?.user ?? null;

  let viewerRole: string | null = null;
  if (user) {
    try {
      const { data: viewer } = await authClient
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      viewerRole = (viewer as { role?: string } | null)?.role ?? null;
    } catch (_e) {
      // If reading the profile fails for any reason, default to null
      viewerRole = null;
    }
  }

  const usingServiceClient = viewerRole === 'admin';
  // If viewer is admin, prefer the service-role client (bypasses RLS). Otherwise
  // continue to use the request/cookie-aware client.
  const supabase = usingServiceClient ? createServiceClient() : authClient;

  return { supabase, viewerRole, user, usingServiceClient } as const;
}

export type DataClientResult = Awaited<ReturnType<typeof getDataClient>>;
