import { createClient, createClientFromRequest, createServiceClient } from '@/lib/supabase/server';

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
    // 1. Try to get role and ID from headers (passed by proxy for speed)
    const headerRole = request?.headers.get('x-user-role');
    const headerUserId = request?.headers.get('x-user-id');

    const authClient = request ? createClientFromRequest(request) : await createClient();

    let viewerRole: string | null = headerRole ?? null;
    let user: any = headerUserId ? { id: headerUserId } : null;
    let fastPath = false;

    // If we have headers, we can potentially skip two DB calls
    if (headerRole && headerUserId) {
      console.log(
        `[getDataClient] Fast path: using headers (Role: ${headerRole}, ID: ${headerUserId})`
      );
      fastPath = true;
    } else {
      // Slow path: Need to fetch from Supabase
      const { data: auth, error: authError } = await authClient.auth.getUser();
      if (authError) {
        console.warn('[getDataClient] auth.getUser() error:', authError);
      }
      user = auth?.user ?? null;

      if (user) {
        try {
          const { data: viewer } = await authClient
            .from('profiles')
            .select('role')
            .or(`id.eq.${user.id},user_id.eq.${user.id}`)
            .maybeSingle();
          viewerRole = (viewer as { role?: string } | null)?.role ?? null;
          console.log(`[getDataClient] Slow path: fetched role: ${viewerRole}`);
        } catch (profileCatchError) {
          console.warn('[getDataClient] profile query caught error:', profileCatchError);
          viewerRole = null;
        }
      }
    }

    const usingServiceClient =
      viewerRole === 'admin' || viewerRole === 'super_admin' || viewerRole === 'owner';
    const supabase = usingServiceClient ? createServiceClient() : authClient;

    if (!fastPath) {
      console.log(
        `[getDataClient] Using Service Client: ${usingServiceClient} for role: ${viewerRole}`
      );
    }

    return { supabase, viewerRole, user, usingServiceClient } as const;
  } catch (outerError) {
    console.error('[getDataClient] FATAL ERROR:', outerError);
    throw outerError;
  }
}

export type DataClientResult = Awaited<ReturnType<typeof getDataClient>>;
