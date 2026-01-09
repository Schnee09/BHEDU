require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStudents() {
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_code, grade_level')
    .eq('role', 'student')
    .limit(5);
  
  console.log('👨‍🎓 Sample Students:\n');
  students.forEach(s => {
    console.log(`${s.full_name} (${s.student_code})`);
    console.log(`  Grade Level: ${s.grade_level || 'NOT SET'}`);
    console.log(`  ID: ${s.id}\n`);
  });
}

checkStudents();
