import { createClient } from '@supabase/supabase-js';
import { StudentRepository } from '../lib/repositories/StudentRepository';
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
const repository = new StudentRepository(supabase);

async function verifySearchAndIdentification() {
  console.log('🚀 Starting Student search flow verification...');

  const studentData = {
    first_name: 'Search',
    last_name: 'Tester',
    email: `search_test_${Date.now()}@example.com`,
    student_code: `UID-${Date.now()}`,
    student_id: `CID-${Date.now()}`,
    grade_level: 'Lớp 12',
    status: 'active' as const,
  };

  let studentId = '';

  try {
    console.log(
      `📝 Step 1: Creating student with UID=${studentData.student_code} and CID=${studentData.student_id}...`
    );
    const created = await repository.create(studentData);
    studentId = created.id;
    console.log(`✅ Student created: ${studentId}`);

    // Test Search by UID
    console.log(`🔍 Step 2: Testing search by UID (${studentData.student_code})...`);
    const searchUid = await repository.findAll({ search: studentData.student_code });
    if (searchUid?.data && searchUid.data.length > 0 && searchUid.data[0]?.id === studentId) {
      console.log('✅ Search by UID successful.');
    } else {
      throw new Error('Search by UID failed.');
    }

    // Test Search by CID
    console.log(`🔍 Step 3: Testing search by CID (${studentData.student_id})...`);
    const searchCid = await repository.findAll({ search: studentData.student_id });
    if (searchCid?.data && searchCid.data.length > 0 && searchCid.data[0]?.id === studentId) {
      console.log('✅ Search by CID successful.');
    } else {
      throw new Error('Search by CID failed.');
    }

    console.log('\n✨ SEARCH AND IDENTIFICATION VERIFICATION PASSED! ✨');
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    if (studentId) {
      console.log('🧹 Cleaning up...');
      await supabase.from('profiles').delete().eq('id', studentId);
      console.log('✅ Cleanup complete.');
    }
  }
}

verifySearchAndIdentification();
