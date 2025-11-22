// web/lib/supabase/client.ts
// Browser-side Supabase client using @supabase/ssr
// Use this in client components and browser code

import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn('Missing Supabase env vars, returning stub client')
    // Return a minimal stub to avoid crashes in development
    return {
      from: () => ({
        select: () => Promise.resolve({ data: [], error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
        update: () => Promise.resolve({ data: null, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    } as any
  }

  client = createBrowserClient(url, anonKey)
  return client
}

// Singleton export for convenience
export const supabase = createClient()
