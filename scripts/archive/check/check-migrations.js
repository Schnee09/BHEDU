require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigrations() {
  const { data, error } = await supabase
    .from('supabase_migrations')
    .select('*')
    .order('version', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('📋 Recent Migrations:\n');
  data.forEach(m => {
    console.log(`✅ ${m.version} - ${m.name || '(no name)'}`);
  });
  
  // Check specifically for migration 010
  const { data: m010 } = await supabase
    .from('supabase_migrations')
    .select('*')
    .eq('version', '010')
    .single();
  
  console.log('\n📦 Migration 010 (Financial System):');
  if (m010) {
    console.log(`✅ Applied: ${m010.version}`);
    console.log(`   Name: ${m010.name || 'financial_system'}`);
  } else {
    console.log('❌ NOT FOUND - Migration 010 was never applied!');
  }
}

checkMigrations();
