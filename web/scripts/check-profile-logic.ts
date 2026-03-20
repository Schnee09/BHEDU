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

async function checkProfile() {
  console.log('Checking profiles table...');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(
      'id, user_id, full_name, first_name, last_name, role, email, phone, address, date_of_birth, personal_email'
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Postgrest Error:', error);
    console.error('Error Message Type:', typeof error.message);
    console.error('Error keys:', Object.keys(error));
  } else {
    console.log('Profile Found:', profile ? 'Yes' : 'No');
    if (profile) {
      console.log('Profile Data:', profile);
    }
  }
}

checkProfile();
