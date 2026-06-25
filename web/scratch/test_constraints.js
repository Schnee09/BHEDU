const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Querying pg_constraint for permission_audit_logs...');
  const { data, error } = await supabase.rpc('execute_sql_temp', { sql_query: `
    SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'permission_audit_logs';
  `});

  // Note: if execute_sql_temp doesn't exist, we can try running a custom query or pg_catalog query.
  if (error) {
    console.error('Error running execute_sql_temp:', error);
    // Let's try executing standard sql via another method or fallback to a direct pg query if possible.
    // Or check if there is an existing postgres RPC. Let's see what RPC functions exist.
  } else {
    console.log('Constraints:', JSON.stringify(data, null, 2));
  }
}

test();
