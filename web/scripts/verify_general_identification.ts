
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyGeneralIdentification() {
  console.log('🚀 Starting General Identification system verification...');

  const teacherData = {
    first_name: 'Teacher',
    last_name: 'Refinement',
    email: `teacher_ref_${Date.now()}@example.com`,
    role: 'teacher',
    teacher_code: `GV-${Date.now()}`,
    full_name: 'Teacher Refinement'
  };

  const studentData = {
    first_name: 'Student',
    last_name: 'Refinement',
    email: `student_ref_${Date.now()}@example.com`,
    role: 'student',
    student_code: `HS-${Date.now()}`,
    student_id: `CID-${Date.now()}`,
    full_name: 'Student Refinement'
  };

  let teacherId = '';
  let studentId = '';

  try {
    // 1. Create Teacher with UID
    console.log(`📝 Step 1: Creating teacher with UID=${teacherData.teacher_code}...`);
    const { data: teacher, error: tError } = await supabase
      .from('profiles')
      .insert([teacherData])
      .select()
      .single();
    
    if (tError) throw tError;
    teacherId = teacher.id;
    console.log(`✅ Teacher created with teacher_code: ${teacher.teacher_code}`);

    // 2. Create Student with UID & CID
    console.log(`📝 Step 2: Creating student with UID=${studentData.student_code} and CID=${studentData.student_id}...`);
    const { data: student, error: sError } = await supabase
      .from('profiles')
      .insert([studentData])
      .select()
      .single();
    
    if (sError) throw sError;
    studentId = student.id;
    console.log(`✅ Student created with student_code: ${student.student_code} and student_id: ${student.student_id}`);

    // 3. Verify searching by Teacher UID
    console.log(`🔍 Step 3: Verifying search by Teacher UID...`);
    const { data: tSearch, error: tsError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('teacher_code', teacherData.teacher_code);
    
    if (tsError || tSearch.length === 0) throw new Error('Teacher UID search failed');
    console.log('✅ Teacher UID search confirmed.');

    // 4. Verify searching by Student CID
    console.log(`🔍 Step 4: Verifying search by Student CID...`);
    const { data: sSearch, error: ssError } = await supabase
      .from('profiles')
      .select('id')
      .ilike('student_id', studentData.student_id);
    
    if (ssError || sSearch.length === 0) throw new Error('Student CID search failed');
    console.log('✅ Student CID search confirmed.');

    console.log('\n✨ GENERAL IDENTIFICATION SYSTEM VERIFICATION PASSED! ✨');

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    if (error.code === '42703') {
      console.error('💡 Error 42703 (Undefined Column): It seems the "teacher_code" column has not been added to the database yet. Please apply the migration in supabase/migrations/20260411172500_add_teacher_code_to_profiles.sql');
    }
  } finally {
    if (teacherId) {
      console.log('🧹 Cleaning up Teacher...');
      await supabase.from('profiles').delete().eq('id', teacherId);
    }
    if (studentId) {
      console.log('🧹 Cleaning up Student...');
      await supabase.from('profiles').delete().eq('id', studentId);
    }
    console.log('✅ Cleanup complete.');
  }
}

verifyGeneralIdentification();
