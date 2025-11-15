// web/lib/supabaseClient.ts
// Use @supabase/ssr for proper cookie-based auth in Next.js
import { createBrowserClient } from '@supabase/ssr'

// Singleton browser client for consistent cookie-based auth
// Using ReturnType to get exact type from createBrowserClient
let _client: ReturnType<typeof createBrowserClient> | undefined

type SupabaseLike = {
  auth: {
    getSession: () => Promise<{ data: { session: unknown } | { session: null }; error: null }>
    signOut: () => Promise<{ error: null }>
    signInWithPassword: (_?: unknown) => Promise<{ data: { user: unknown } | { user: null }; error: null }>
    signInWithOtp: (_?: unknown) => Promise<{ error: null }>
    onAuthStateChange: () => { data: { subscription: { unsubscribe: () => void } } }
  }
  from: (_table: string) => {
    select: (_?: unknown) => Promise<{ data: unknown; error: null }>
    eq: (_col?: unknown, _val?: unknown) => Promise<{ data: unknown; error: null }>
    in: (_col?: unknown, _vals?: unknown) => Promise<{ data: unknown; error: null }>
    maybeSingle: () => Promise<{ data: unknown; error: null }>
    single: () => Promise<{ data: unknown; error: null }>
    order: (_col?: unknown, _opts?: unknown) => Promise<{ data: unknown; error: null }>
  }
}

function buildStub(): SupabaseLike {
  // Minimal shape used by our code paths; all methods return empty data.
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: null }),
      signInWithOtp: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      eq: () => Promise.resolve({ data: [], error: null }),
      in: () => Promise.resolve({ data: [], error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
  };
}

function ensureClient(): ReturnType<typeof createBrowserClient> {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) {
    // During build / SSR without envs return stub (client components will hydrate with real values in Vercel)
    _client = buildStub() as unknown as ReturnType<typeof createBrowserClient>
    return _client as ReturnType<typeof createBrowserClient>
  }
  _client = createBrowserClient(url, anon)
  return _client
}

// ✅ single reusable client reference
export const supabase: ReturnType<typeof createBrowserClient> = ensureClient()

// ✅ factory for places expecting createClient()
export function createClient() {
  return ensureClient()
}
