#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkSchema() {
  // Get a sample record from classes
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('\n📋 Classes table columns:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n📝 Sample record:');
    console.log(JSON.stringify(data[0], null, 2));
  }
  
  // Check profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .limit(1);
  
  if (profiles && profiles.length > 0) {
    console.log('\n👤 Profiles (student) columns:');
    console.log(Object.keys(profiles[0]).join(', '));
  }
  
  // Check fee_types table
  const { data: feeTypes } = await supabase
    .from('fee_types')
    .select('*')
    .limit(1);
  
  if (feeTypes && feeTypes.length > 0) {
    console.log('\n💵 Fee Types table columns:');
    console.log(Object.keys(feeTypes[0]).join(', '));
    console.log('\n📝 Sample fee type:');
    console.log(JSON.stringify(feeTypes[0], null, 2));
  }
}

checkSchema();
