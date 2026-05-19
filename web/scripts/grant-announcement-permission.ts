import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function grantAll() {
  // List of all administrative profile IDs we found
  const adminIds = [
    '1be48ae2-3e35-490b-9840-059330b85f1a', // Quản Trị Viên (admin@bhedu.vn)
    'fb5a6b89-7882-4452-a8c0-884cf6a44cb9', // Viên Quản Trị (test_admin_rls@example.com)
    '5fdf90fc-ce57-4d0e-92e8-49344dd1dca0', // Staff (staff@bhedu.vn)
    'db7a4055-65f5-4814-a50c-6e82818256a7', // Trị Siêu Quản (superadmin@bhedu.vn)
  ];

  const perm = 'announcements.manage';

  for (const userId of adminIds) {
    console.log(`Checking if custom permission '${perm}' exists for user ${userId}...`);

    const { data: existing, error: fetchError } = await supabase
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('permission_code', perm)
      .maybeSingle();

    if (fetchError) {
      console.error(`❌ Error checking for user ${userId}:`, fetchError);
      continue;
    }

    if (existing) {
      console.log(`✅ Custom permission already exists for user ${userId}`);
      continue;
    }

    console.log(`Adding custom permission '${perm}' for user ${userId}...`);
    const { data: inserted, error: insertError } = await supabase
      .from('user_permissions')
      .insert({
        user_id: userId,
        permission_code: perm,
        is_denied: false,
        expires_at: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`❌ Error inserting for user ${userId}:`, insertError);
    } else {
      console.log(`✅ Custom permission granted successfully to user ${userId}`);
    }
  }
}

grantAll();
