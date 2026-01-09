require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listFeeTypes() {
  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('id, name, description, amount')
    .eq('is_active', true);
  
  console.log('📋 Fee Types in Database:\n');
  feeTypes.forEach((ft, i) => {
    console.log(`${i + 1}. ${ft.name}`);
    console.log(`   Description: ${ft.description}`);
    console.log(`   Amount: ${ft.amount}`);
    console.log(`   ID: ${ft.id}\n`);
  });
}

listFeeTypes();
