
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260509110500_fix_enrollment_capacity_trigger.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('Applying migration...');
  
  // We use a raw RPC to execute SQL if available, or just use the REST API to run the function creation.
  // In Supabase, you can't run arbitrary SQL via the client easily unless you have a specific RPC.
  // But wait, I can just create the function and trigger via the SQL Editor (which I can't access).
  // I'll try to use the 'postgres' RPC if it exists.
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Failed to apply migration via RPC:', error);
    console.log('Try to run the script via psql or Supabase Dashboard.');
  } else {
    console.log('Migration applied successfully!');
  }
}

applyMigration();
