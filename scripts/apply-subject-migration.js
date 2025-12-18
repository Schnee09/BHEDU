/**
 * Apply Subject Classification Migration
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔧 Applying subject classification migration...');

    // Add subject_type column if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_type text DEFAULT 'core' CHECK (subject_type IN ('core', 'elective', 'specialized'));`
    });

    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Subject classification migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();