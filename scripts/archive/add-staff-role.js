#!/usr/bin/env node

/**
 * Run Staff Role Migration
 * Adds 'staff' to the role constraint
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('🚀 Adding staff role to database...\n');

  // We can't run DDL directly, but we can check current state
  // and provide instructions

  // Check current profiles with role
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('role')
    .limit(1);

  if (error) {
    console.error('❌ Database error:', error.message);
    return;
  }

  console.log('📋 To add staff role, run this SQL in Supabase SQL Editor:\n');
  console.log('='.repeat(60));
  console.log(`
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'staff', 'teacher', 'student') OR role IS NULL);
`);
  console.log('='.repeat(60));
  console.log('\n🔗 Open: ' + SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/_/sql'));
}

main().catch(console.error);
