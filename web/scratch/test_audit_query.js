const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Querying permission_audit_logs with column name hints...');
  const { data, error } = await supabase
    .from('permission_audit_logs')
    .select(`
      *,
      user:profiles!user_id (id, full_name, role),
      performer:profiles!performed_by (id, full_name)
    `)
    .limit(5);

  if (error) {
    console.error('Error with column hints:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success count with column hints:', data.length);
    console.log('Sample data:', JSON.stringify(data[0], null, 2));
  }

  console.log('Querying permission_audit_logs with constraint name hints...');
  const { data: data2, error: error2 } = await supabase
    .from('permission_audit_logs')
    .select(`
      *,
      user:profiles!permission_audit_logs_user_fkey (id, full_name, role),
      performer:profiles!permission_audit_logs_performer_fkey (id, full_name)
    `)
    .limit(5);

  if (error2) {
    console.error('Error with constraint hints:', JSON.stringify(error2, null, 2));
  } else {
    console.log('Success count with constraint hints:', data2.length);
  }
}

test();
