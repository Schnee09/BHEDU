// web/lib/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function getBrowserSupabase() {
  return createBrowserClient(url, anon)
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = getBrowserSupabase()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}
