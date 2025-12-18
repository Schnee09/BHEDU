const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking database tables visibility...');
  
  const tablesToCheck = [
    'curriculum_standards',
    'evaluation_types',
    'subject_groups',
    'subject_group_subjects',
    'student_conducts'
  ];

  for (const table of tablesToCheck) {
    try {
      // Try to select one row, just to check existence
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST205') {
          console.log(`❌ Table '${table}' NOT found in schema cache.`);
        } else {
          console.log(`❌ Error accessing '${table}': ${error.message} (${error.code})`);
        }
      } else {
        console.log(`✅ Table '${table}' is accessible.`);
      }
    } catch (err) {
      console.log(`❌ Exception checking '${table}':`, err.message);
    }
  }
}

checkTables();