require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function assignGradeLevels() {
  console.log('📚 Assigning grade levels to students...\n');
  
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_code')
    .eq('role', 'student')
    .order('student_code');
  
  // Assign grades in a pattern: 10, 11, 12, 10, 11, 12, ...
  const grades = [10, 11, 12];
  
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const grade = grades[i % 3];
    
    const { error } = await supabase
      .from('profiles')
      .update({ grade_level: grade })
      .eq('id', student.id);
    
    if (error) {
      console.log(`❌ ${student.full_name} - ${error.message}`);
    } else {
      console.log(`✅ ${student.full_name} (${student.student_code}) → Grade ${grade}`);
    }
  }
  
  console.log('\n✨ Grade level assignment complete!');
}

assignGradeLevels();
