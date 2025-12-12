require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTable() {
  console.log('🔗 Testing direct access to student_accounts table...');
  try {
    const { data, error } = await supabase
      .from('student_accounts')
      .select('*')
      .limit(1);
    if (error) {
      console.log('❌ Cannot access student_accounts:', error.message);
    } else {
      console.log('✅ student_accounts table is accessible. Sample:', data);
    }
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testTable();
