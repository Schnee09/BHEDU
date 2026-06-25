const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Querying assignments with nested relations...');
  const { data, error } = await supabase
    .from('assignments')
    .select(`
      id,
      title,
      due_date,
      class:classes(
        name,
        course:courses(
          subject:subjects(name, code)
        )
      )
    `)
    .limit(5);

  if (error) {
    console.error('Error querying assignments:', JSON.stringify(error, null, 2));
  } else {
    console.log('Successfully queried assignments. Data count:', data.length);
    console.log('Sample result:', JSON.stringify(data[0], null, 2));
  }
}

test();
