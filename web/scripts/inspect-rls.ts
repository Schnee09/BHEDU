import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing Supabase env vars:', { url: !!url, serviceKey: !!serviceKey });
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function inspectRLS() {
  console.log("Inspecting RLS policies for 'profiles'...");

  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query:
      "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';",
  });

  if (error) {
    if (error.message.includes('function rpc.exec_sql() does not exist')) {
      console.log('RPC exec_sql not found. Falling back to direct query (if authorized)...');
      // Often exec_sql is not enabled.
      // We can try to just select from a view if we have access, but pg_policies usually needs admin.
      // Let's try to find an alternative way to see policies.
      console.error(
        'Cannot query pg_policies directly via Supabase API without a helper function.'
      );
    } else {
      console.error('RPC Error:', error);
    }
  } else {
    console.table(data);
  }
}

inspectRLS();
