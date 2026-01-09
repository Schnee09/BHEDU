const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSchoolName() {
  console.log('🔄 Updating School Name to "Bui Hoang Education"...');

  try {
    // Check if school_settings table exists and has data
    const { data: settings, error: fetchError } = await supabase
      .from('school_settings')
      .select('*')
      .eq('key', 'school_name')
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Error fetching school settings:', fetchError.message);
      return;
    }

    if (settings) {
      console.log(`   Current name: "${settings.value}"`);
      
      if (settings.value !== 'Bui Hoang Education') {
        const { error: updateError } = await supabase
          .from('school_settings')
          .update({ value: 'Bui Hoang Education' })
          .eq('key', 'school_name');

        if (updateError) {
          console.error('❌ Error updating school name:', updateError.message);
        } else {
          console.log('   ✅ Successfully updated school name to "Bui Hoang Education"');
        }
      } else {
        console.log('   ✅ School name is already correct.');
      }
    } else {
      console.log('   ⚠️ "school_name" setting not found. Inserting...');
      const { error: insertError } = await supabase
        .from('school_settings')
        .insert({
          key: 'school_name',
          value: 'Bui Hoang Education',
          description: 'Official name of the school',
          is_system: true
        });
        
      if (insertError) {
        console.error('❌ Error inserting school name:', insertError.message);
      } else {
        console.log('   ✅ Successfully inserted school name "Bui Hoang Education"');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateSchoolName();
