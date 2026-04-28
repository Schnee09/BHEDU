
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

async function verifyIdentificationFlow() {
  console.log('🚀 Starting Student Identification Flow Verification...');

  const testStudentData = {
    first_name: 'Test',
    last_name: 'Verification',
    email: `test_verify_${Date.now()}@example.com`,
    student_code: 'HS20269999', // UID
    student_id: 'CID-9999-VERIFY', // CID
    grade_level: 'Lớp 12',
    status: 'active' as const
  };

  let studentId = '';

  try {
    // 1. Create Student
    console.log('📝 Step 1: Creating student with UID=HS20269999 and CID=CID-9999-VERIFY...');
    const created = await repository.create(testStudentData);
    studentId = created.id;
    console.log(`✅ Student created with ID: ${studentId}`);
    
    if (created.student_code !== testStudentData.student_code || created.student_id !== testStudentData.student_id) {
      throw new Error(`Data mismatch on create! UID: ${created.student_code}, CID: ${created.student_id}`);
    }

    // 2. Find Student
    console.log('🔍 Step 2: Finding student by ID...');
    const found = await repository.findById(studentId);
    if (!found) throw new Error('Student not found after creation');
    console.log(`✅ Found student: UID=${found.student_code}, CID=${found.student_id}`);

    if (found.student_code !== testStudentData.student_code || found.student_id !== testStudentData.student_id) {
      throw new Error(`Data mismatch on fetch! UID: ${found.student_code}, CID: ${found.student_id}`);
    }

    // 3. Update Student
    console.log('update Step 3: Updating CID...');
    const updatedData = {
      student_id: 'CID-NEW-9999'
    };
    const updated = await repository.update(studentId, updatedData);
    console.log(`✅ Student updated: CID=${updated.student_id}`);

    if (updated.student_id !== updatedData.student_id) {
      throw new Error(`Data mismatch on update! CID: ${updated.student_id}`);
    }

    // 4. Verify in List
    console.log('📋 Step 4: Verifying in list view...');
    const list = await repository.findAll({ search: 'Test Verification' });
    const match = list.data.find(s => s.id === studentId);
    if (!match) throw new Error('Student not found in search results');
    console.log(`✅ List Match: UID=${match.student_code}, CID=${match.student_id}`);

    console.log('\n✨ ALL REPOSITORY LEVEL TESTS PASSED! ✨');

  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    if (studentId) {
      console.log('🧹 Cleaning up test student...');
      await supabase.from('profiles').delete().eq('id', studentId);
      console.log('✅ Cleanup complete.');
    }
  }
}

verifyIdentificationFlow();
