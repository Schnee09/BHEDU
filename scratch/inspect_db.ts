
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTable() {
  const { data, error } = await supabase.rpc('get_table_definition', { table_name_param: 'enrollments' });
  
  if (error) {
    // If RPC doesn't exist, try to query information_schema if possible (often blocked)
    console.log('RPC get_table_definition failed, trying raw query...');
    const { data: cols, error: colError } = await supabase.from('enrollments').select('*').limit(0);
    if (colError) console.error('Error:', colError);
    else console.log('Columns found:', Object.keys(cols[0] || {}));
    
    // Try to get enum values
    const { data: enums, error: enumError } = await supabase.rpc('get_enum_values', { enum_name: 'enrollment_status' });
    if (enumError) console.error('Enum Error:', enumError);
    else console.log('Enum Values:', enums);
  } else {
    console.log('Table Definition:', data);
  }
}

inspectTable();
