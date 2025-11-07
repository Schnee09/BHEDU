// web/lib/supabaseClient.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ create a single reusable client
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// ✅ also export a factory if you ever want to make isolated instances (e.g. in SSR)
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

