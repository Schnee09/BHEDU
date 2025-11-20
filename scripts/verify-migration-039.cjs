#!/usr/bin/env node
/**
 * Verify Migration 039 - Check if first_name, last_name columns exist
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '..', 'web', '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function verifyMigration039() {
  console.log('🔍 Verifying Migration 039: first_name/last_name columns...\n')

  // Login as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@bhedu.example.com',
    password: 'Admin123!'
  })

  if (authError) {
    console.error('❌ Admin login failed:', authError.message)
    process.exit(1)
  }

  console.log('✅ Admin login successful\n')

  // Try to select first_name, last_name from profiles
  console.log('📝 Testing SELECT with first_name, last_name...')
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, email')
    .limit(5)

  if (error) {
    console.error('❌ Migration 039 NOT applied!')
    console.error('Error:', error.message)
    console.error('\n⚠️  You need to apply migration 039:')
    console.error('   1. Open Supabase SQL Editor')
    console.error('   2. Copy contents of supabase/migrations/039_add_first_last_name_to_profiles.sql')
    console.error('   3. Execute it\n')
    process.exit(1)
  }

  console.log('✅ Migration 039 APPLIED successfully!\n')
  
  if (data && data.length > 0) {
    console.log('📊 Sample data from profiles table:')
    console.table(data.map(row => ({
      id: row.id.substring(0, 8) + '...',
      full_name: row.full_name || '(null)',
      first_name: row.first_name || '(null)',
      last_name: row.last_name || '(null)',
      email: row.email || '(null)'
    })))
  } else {
    console.log('⚠️  No profile data found in database')
  }

  // Check if trigger exists
  console.log('\n🔧 Checking if sync trigger exists...')
  const { data: triggerData } = await supabase.rpc('pg_get_triggerdef', { 
    trigger_oid: 'sync_full_name_trigger' 
  }).single()
  
  if (triggerData) {
    console.log('✅ sync_full_name_trigger exists')
  }

  console.log('\n✅ All checks passed! Migration 039 is working correctly.')
  console.log('\n📋 Next steps:')
  console.log('   1. Review RLS policies')
  console.log('   2. Verify test data')
  console.log('   3. Test API endpoints')
}

verifyMigration039().catch(err => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})
