/**
 * scripts/test-service-key.ts
 * ----------------------------
 * Run this test with:
 *   npx tsx scripts/test-service-key.ts
 *
 * It will validate your .env.local Supabase keys and
 * try to list users via the Admin API.
 */

import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: "./.env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  console.error({ NEXT_PUBLIC_SUPABASE_URL: !!url, SUPABASE_SERVICE_ROLE_KEY: !!serviceKey });
  process.exit(1);
}

console.log("🌍 Supabase URL:", url);
console.log("🔐 Service key prefix:", serviceKey.slice(0, 15) + "...");

// Create admin Supabase client
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${serviceKey}` } },
});

async function main() {
  console.log("🔎 Checking admin access to Supabase Auth...");

  const { data, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("❌ Admin listUsers() failed:");
    console.error(error);
    process.exit(1);
  }

  console.log(`✅ Success! Found ${data.users.length} users.`);
  for (const user of data.users.slice(0, 3)) {
    console.log(`   - ${user.email} (${user.id})`);
  }

  console.log("🎉 Service role key works correctly!");
}

main();
