// web/lib/supabase/server.ts
// Updated: 2025-01-20 - Force Vercel rebuild with clean cache
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

/**
 * Cookie-aware Supabase server client for SSR/server actions.
 * Uses anon key + cookies to access the user's session securely.
 */
export async function createClient() {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options })
      },
    },
  })
}

/**
 * Create Supabase client from Next.js Request (for API routes)
 */
export function createClientFromRequest(request: NextRequest | Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Get cookies from request
  const cookieStore = 'cookies' in request ? request.cookies : undefined
  
  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        if (cookieStore && 'get' in cookieStore) {
          return cookieStore.get(name)?.value
        }
        // Fallback for standard Request
        const cookies = request.headers.get('cookie')
        if (!cookies) return undefined
        const match = cookies.match(new RegExp(`(^|;\\s*)${name}=([^;]*)`))
        return match ? decodeURIComponent(match[2]) : undefined
      },
      set() {
        // No-op for request-based client (response handling done elsewhere)
      },
      remove() {
        // No-op for request-based client
      },
    },
  })
}

/**
 * Service role client for admin/system operations (bypasses RLS).
 * WARNING: Never expose service role key to the client!
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service client');
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Create a Supabase client that authenticates using a Bearer token.
 * Useful when API requests send Authorization headers instead of cookies.
 */
export function createClientFromToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const client = createSupabaseClient(url, anon, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  return client
}


