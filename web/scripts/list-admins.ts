import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAdmins() {
  console.log('🔍 Fetching all administrative profiles...');
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, email, role')
    .in('role', ['admin', 'super_admin', 'owner', 'staff']);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Administrative profiles:');
  console.log(JSON.stringify(profiles, null, 2));
}

listAdmins();
