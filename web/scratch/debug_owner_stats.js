const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: classes, error: classErr } = await supabase
    .from('classes')
    .select(`
      id,
      name,
      max_capacity,
      teacher:profiles!classes_teacher_id_fkey(full_name),
      course:courses(name),
      enrollments(id, status)
    `);
  console.log('Classes count:', classes?.length || 0, classErr || '');
  if (classes) {
    console.log('First class:', JSON.stringify(classes[0], null, 2));
  }
}

test();
