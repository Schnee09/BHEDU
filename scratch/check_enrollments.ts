
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkEnrollments() {
  const classId = 'f6185432-f927-45bd-b802-ca79fc13b5ae';
  console.log(`Checking enrollments for class: ${classId}`);

  const { data, error } = await supabase
    .from('enrollments')
    .select('*, profiles(full_name, email)')
    .eq('class_id', classId);

  if (error) {
    console.error('Error fetching enrollments:', error);
    return;
  }

  console.log(`Found ${data?.length} enrollments:`);
  data?.forEach(e => {
    console.log(`- Student: ${e.profiles?.full_name} (${e.student_id}), Status: ${e.status}, Date: ${e.enrollment_date}`);
  });
}

checkEnrollments();
