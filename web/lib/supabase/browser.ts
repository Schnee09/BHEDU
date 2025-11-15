// web/lib/supabase/browser.ts
// Ensure a single browser Supabase client instance to avoid multiple GoTrueClient warnings.
import { supabase } from '@/lib/supabaseClient'

export function getBrowserSupabase() {
  return supabase
}

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}
