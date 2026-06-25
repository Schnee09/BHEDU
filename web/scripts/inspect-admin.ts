import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  console.log("🔍 Querying profiles for 'Viên'...");
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Viên%');

  if (error) {
    console.error('❌ Error fetching profiles:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log("⚠️ No profiles matching 'Viên' found. Listing all admin/staff profiles:");
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['admin', 'staff', 'ADMIN', 'STAFF']);
    console.log(JSON.stringify(admins, null, 2));
  } else {
    console.log("✅ Found profiles matching 'Viên':");
    console.log(JSON.stringify(profiles, null, 2));
  }
}

inspect();
