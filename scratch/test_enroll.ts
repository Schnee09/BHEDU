
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

async function testEnroll() {
  const classId = 'f6185432-f927-45bd-b802-ca79fc13b5ae';
  // Try to find a student ID first
  const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student').limit(1);
  if (!students || students.length === 0) {
    console.error('No students found to test with');
    return;
  }
  const studentId = students[0].id;
  console.log(`Testing enrollment for student ${studentId} into class ${classId}`);

  const enrollment = {
    student_id: studentId,
    class_id: classId,
    status: 'enrolled',
    enrollment_date: new Date().toISOString().split('T')[0],
  };

  const { data, error } = await supabase
    .from('enrollments')
    .upsert(enrollment, { onConflict: 'student_id,class_id' })
    .select();

  if (error) {
    console.error('Upsert failed:', error);
  } else {
    console.log('Upsert succeeded:', data);
  }
}

testEnroll();
