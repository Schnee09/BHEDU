#!/usr/bin/env node

/**
 * Execute Staff Role Migration via SQL
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', 'web', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function main() {
  console.log('\n' + '═'.repeat(60))
  console.log('Updating Role Constraint for Staff Role')
  console.log('═'.repeat(60) + '\n')

  try {
    // First, check current role constraint
    const { data: constraintCheck } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    console.log('✅ Connection established to Supabase\n')

    // Now try to update the constraint using SQL
    // Since we can't directly execute SQL, we'll work around it
    console.log('Attempting to update role constraint...\n')

    // Step 1: Try to insert with staff role to test current constraint
    const testInsert = await supabase
      .from('profiles')
      .insert({
        email: 'constraint-test@test.com',
        full_name: 'Test',
        role: 'staff',
        status: 'test'
      })

    if (testInsert.error && testInsert.error.message.includes('check constraint')) {
      console.log('⚠️  Staff role not yet supported in database')
      console.log('\n🔧 You must manually run the migration in Supabase SQL Editor:\n')
      console.log('   1. Go to: https://supabase.com/dashboard/project/_/sql/new')
      console.log('   2. Copy the SQL from: supabase/migrations/20241209_add_staff_role_complete.sql')
      console.log('   3. Paste and execute\n')
      console.log('   This adds the staff role to the database.\n')
      return false
    } else if (testInsert.error) {
      console.log('Error:', testInsert.error.message)
    } else {
      console.log('✅ Staff role appears to be supported!')
      // Clean up test record
      await supabase
        .from('profiles')
        .delete()
        .eq('email', 'constraint-test@test.com')
      return true
    }
  } catch (error) {
    console.error('Error:', error.message)
  }

  return false
}

main()
