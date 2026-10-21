import {
  createClient,
  createClientFromRequest,
  createClientFromToken,
  createServiceClient,
} from '@/lib/supabase/server';

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
  try {
    // Authentication must be derived from a verified Supabase session/token.
    // Never trust identity or role headers supplied by the caller: API routes do
    // not pass through the dashboard proxy, so those headers are forgeable.
    const bearerToken = request?.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
    const authClient = bearerToken
      ? createClientFromToken(bearerToken)
      : request
        ? createClientFromRequest(request)
        : await createClient();

    const { data: auth, error: authError } = await authClient.auth.getUser();
    const user = authError ? null : (auth?.user ?? null);
    let viewerRole: string | null = null;

    if (user) {
      const { data: viewer, error: profileError } = await authClient
        .from('profiles')
        .select('role')
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .maybeSingle();

      if (!profileError) {
        viewerRole = (viewer as { role?: string } | null)?.role ?? null;
      }
    }

    const usingServiceClient =
      viewerRole === 'admin' || viewerRole === 'super_admin' || viewerRole === 'owner';
    const supabase = usingServiceClient ? createServiceClient() : authClient;

    return { supabase, viewerRole, user, usingServiceClient } as const;
  } catch (outerError) {
    console.error('[getDataClient] FATAL ERROR:', outerError);
    throw outerError;
  }
}

export type DataClientResult = Awaited<ReturnType<typeof getDataClient>>;
