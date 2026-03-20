/**
 * scripts/test-grade-apis.ts
 * Tests the grade entry and analytics APIs
 *
 * Run with: npx tsx scripts/test-grade-apis.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !service) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🧪 Testing Grade APIs (Database Level)\n');

  // 1. Check subjects
  console.log('═══════════════════════════════════════');
  console.log('1️⃣  SUBJECTS');
  console.log('═══════════════════════════════════════');
  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, code, name');

  if (subErr) {
    console.log(`   ❌ Error: ${subErr.message}`);
  } else {
    console.log(`   ✅ Found ${subjects?.length || 0} subjects:`);
    subjects?.forEach((s) => console.log(`      - ${s.code}: ${s.name}`));
  }

  // 2. Check classes
  console.log('\n═══════════════════════════════════════');
  console.log('2️⃣  CLASSES');
  console.log('═══════════════════════════════════════');
  const { data: classes, error: clsErr } = await supabase
    .from('classes')
    .select('id, name')
    .limit(10);

  if (clsErr) {
    console.log(`   ❌ Error: ${clsErr.message}`);
  } else {
    console.log(`   ✅ Found ${classes?.length || 0} classes:`);
    classes?.forEach((c) => console.log(`      - ${c.name}`));
  }

  // 3. Check grades with new schema
  console.log('\n═══════════════════════════════════════');
  console.log('3️⃣  GRADES (New Schema)');
  console.log('═══════════════════════════════════════');
  const { data: grades, error: gradeErr } = await supabase
    .from('grades')
    .select('id, score, subject_id, class_id, component_type, semester')
    .limit(10);

  if (gradeErr) {
    console.log(`   ❌ Error: ${gradeErr.message}`);
  } else {
    console.log(`   ✅ Found ${grades?.length || 0} sample grades:`);
    grades?.forEach((g) => {
      console.log(
        `      - Score: ${g.score} | subject_id: ${g.subject_id?.slice(0, 8) || 'NULL'} | class_id: ${g.class_id?.slice(0, 8) || 'NULL'} | ${g.component_type || 'N/A'} | Sem ${g.semester || 'N/A'}`
      );
    });
  }

  // 4. Check grade stats
  console.log('\n═══════════════════════════════════════');
  console.log('4️⃣  GRADE STATISTICS');
  console.log('═══════════════════════════════════════');
  const { count: totalGrades } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true });
  const { count: withSubject } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .not('subject_id', 'is', null);
  const { count: withClass } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .not('class_id', 'is', null);
  const { count: normalized } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .lte('score', 10);

  console.log(`   Total Grades: ${totalGrades}`);
  console.log(`   With subject_id: ${withSubject}`);
  console.log(`   With class_id: ${withClass}`);
  console.log(`   Normalized (score ≤ 10): ${normalized}`);

  // 5. Test a query like the API would do
  console.log('\n═══════════════════════════════════════');
  console.log('5️⃣  SAMPLE API QUERY');
  console.log('═══════════════════════════════════════');

  if (classes && classes.length > 0 && subjects && subjects.length > 0) {
    const testClassId = classes[0]?.id;
    const testSubjectId = subjects[0]?.id;

    const { data: apiGrades, error: apiErr } = await supabase
      .from('grades')
      .select('score, points_earned, component_type, student_id')
      .eq('class_id', testClassId)
      .eq('subject_id', testSubjectId)
      .limit(5);

    if (apiErr) {
      console.log(`   ❌ Error: ${apiErr.message}`);
    } else {
      console.log(`   Class: ${classes[0]?.name || 'N/A'}, Subject: ${subjects[0]?.name || 'N/A'}`);
      console.log(`   Found ${apiGrades?.length || 0} grades:`);
      apiGrades?.forEach((g) => {
        console.log(`      - Score: ${g.score} | Component: ${g.component_type}`);
      });
    }
  }

  console.log('\n✨ Test Complete!');
}

main().catch(console.error);
