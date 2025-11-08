// web/lib/supabaseClient.ts
// Use the official Supabase JS client for browser usage.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ create a single reusable client
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// ✅ also export a factory named `createClient` because other modules import that name
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
