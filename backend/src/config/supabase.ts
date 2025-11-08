// src/config/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL as string;
// Use a clearly named server-only env var for the service role key
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string; // service role for server

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase credentials in .env (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});
