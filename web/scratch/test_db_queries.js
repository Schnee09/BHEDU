const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpc() {
  console.log('Testing RPC "execute_sql_temp"...');
  const { data, error } = await supabase.rpc('execute_sql_temp', { sql_query: 'SELECT 1 as val' });
  if (error) {
    console.log('execute_sql_temp failed:', error.message);
  } else {
    console.log('execute_sql_temp success! Result:', data);
  }
}

async function queryTablesDirectly() {
  console.log('Querying information_schema.tables...');
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name, table_type')
    .eq('table_schema', 'public');
  
  if (error) {
    console.log('Querying information_schema.tables failed:', error.message);
  } else {
    console.log('Found tables:', data.map(t => t.table_name));
  }
}

async function run() {
  await checkRpc();
  await queryTablesDirectly();
}

run();
