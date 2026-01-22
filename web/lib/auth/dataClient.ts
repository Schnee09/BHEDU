import {
  createClient,
  createClientFromRequest,
  createServiceClient,
} from "@/lib/supabase/server";

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
    const authClient = request
      ? createClientFromRequest(request)
      : await createClient();
    const { data: auth, error: authError } = await authClient.auth.getUser();

    if (authError) {
      console.warn("[getDataClient] auth.getUser() error:", authError);
    }

    const user = auth?.user ?? null;

    let viewerRole: string | null = null;
    if (user) {
      try {
        const { data: viewer } = await authClient
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();
        viewerRole = (viewer as { role?: string } | null)?.role ?? null;
      } catch (profileCatchError) {
        console.warn(
          "[getDataClient] profile query caught error:",
          profileCatchError,
        );
        viewerRole = null;
      }
    }

    const usingServiceClient = viewerRole === "admin";
    const supabase = usingServiceClient ? createServiceClient() : authClient;

    return { supabase, viewerRole, user, usingServiceClient } as const;
  } catch (outerError) {
    console.error("[getDataClient] FATAL ERROR:", outerError);
    throw outerError; // Re-throw to be caught by the caller (e.g. teacherAuth)
  }
}

export type DataClientResult = Awaited<ReturnType<typeof getDataClient>>;
