
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEnum() {
  // Querying pg_enum and pg_type to see the values
  const { data, error } = await supabase.from('_pg_enum_check').select('*').limit(0); 
  // Wait, I can't query system tables directly.
  // I'll try to insert 'active' and see the error.
  
  console.log('Attempting to insert "active" to see if it works...');
  const { error: activeError } = await supabase.from('enrollments').insert({
    student_id: '3486c1e7-a49f-4919-86b0-b842a5ec68cc', // A valid student ID from before
    class_id: 'f6185432-f927-45bd-b802-ca79fc13b5ae',
    status: 'active'
  });
  
  if (activeError) {
    console.log('Insert "active" failed as expected:', activeError.message);
  } else {
    console.log('Insert "active" SUCCEEDED! This means the column is NOT the enum we thought.');
  }

  console.log('Attempting to insert "enrolled"...');
  const { error: enrolledError } = await supabase.from('enrollments').insert({
    student_id: '3486c1e7-a49f-4919-86b0-b842a5ec68cc',
    class_id: 'f6185432-f927-45bd-b802-ca79fc13b5ae',
    status: 'enrolled'
  });
  
  if (enrolledError) {
    console.log('Insert "enrolled" FAILED:', enrolledError.message);
  } else {
    console.log('Insert "enrolled" SUCCEEDED!');
  }
}

checkEnum();
