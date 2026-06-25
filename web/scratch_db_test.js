const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Querying timetable_slots with complex select...');
  const { data, error } = await supabase
    .from('timetable_slots')
    .select(`
        id, class_id, student_id, day_of_week, start_time, end_time, room, notes, semester_id,
        subject:subjects (id, name, code),
        teacher:profiles!timetable_slots_teacher_id_fkey (id, full_name),
        student:profiles!timetable_slots_student_id_fkey (id, full_name),
        class:classes (id, name)
    `)
    .is('deleted_at', null);
  
  if (error) {
    console.error('Error:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('Results count:', data.length);
  console.log('First result:', JSON.stringify(data[0], null, 2));
}

test();
