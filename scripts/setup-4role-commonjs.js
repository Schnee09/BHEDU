#!/usr/bin/env node

/**
 * Complete 4-Role System Setup Script (CommonJS)
 * 
 * Steps:
 * 1. Creates test accounts for all 4 roles
 * 
 * Usage:
 *   node scripts/setup-4role-commonjs.js
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', 'web', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in web/.env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

const TEST_USERS = [
  { email: 'admin@test.com', name: 'Admin User', role: 'admin' },
  { email: 'staff@test.com', name: 'Staff User', role: 'staff' },
  { email: 'teacher@test.com', name: 'Teacher User', role: 'teacher' },
  { email: 'student@test.com', name: 'Student User', role: 'student' },
]

const PASSWORD = 'test123'

/**
 * Create test users
 */
async function createTestUsers() {
  console.log('\n' + '═'.repeat(60))
  console.log('Creating Test Accounts')
  console.log('═'.repeat(60) + '\n')

  let created = 0
  let updated = 0

  for (const user of TEST_USERS) {
    try {
      console.log(`📝 Processing ${user.role.padEnd(8)} | ${user.email}`)

      // Try to create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.name }
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('duplicate')) {
          console.log(`   ⚠️  Auth user already exists`)
        } else {
          throw authError
        }
      } else if (authData.user) {
        console.log(`   ✅ Auth user created: ${authData.user.id}`)
        created++
      }

      // Update or create profile with role
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.email)
        .single()

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: user.role, full_name: user.name })
          .eq('email', user.email)

        if (updateError) {
          console.log(`   ❌ Failed to update profile: ${updateError.message}`)
        } else {
          console.log(`   ✅ Profile role updated to: ${user.role}`)
          updated++
        }
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            email: user.email,
            full_name: user.name,
            role: user.role,
            status: 'active'
          })

        if (insertError) {
          console.log(`   ❌ Failed to create profile: ${insertError.message}`)
        } else {
          console.log(`   ✅ Profile created with role: ${user.role}`)
          created++
        }
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log(`\n✅ Account Setup Complete: ${created} created, ${updated} updated`)
}

/**
 * Display credentials
 */
function displayCredentials() {
  console.log('\n' + '═'.repeat(60))
  console.log('Test Account Credentials')
  console.log('═'.repeat(60))
  console.log('\n📧 Use these to login and test:\n')

  TEST_USERS.forEach(user => {
    console.log(`Role:     ${user.role.toUpperCase().padEnd(10)}`)
    console.log(`Email:    ${user.email}`)
    console.log(`Password: ${PASSWORD}`)
    console.log()
  })

  console.log('═'.repeat(60))
  console.log('What to test:')
  console.log('═'.repeat(60))
  console.log(`
1. Admin (admin@test.com)
   - Should see full dashboard with all sections
   - Can access user management, system config

2. Staff (staff@test.com)
   - Should see operational dashboard
   - Can manage students/teachers but not system config

3. Teacher (teacher@test.com)
   - Should see teaching dashboard
   - Can manage own classes and grades

4. Student (student@test.com)
   - Should see student dashboard
   - Can view own grades, attendance, assignments
  `)
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🚀 4-Role System Setup\n')

  await createTestUsers()
  displayCredentials()

  console.log('═'.repeat(60))
  console.log('✅ Setup Complete!')
  console.log('═'.repeat(60) + '\n')
  
  console.log('Next steps:')
  console.log('1. Visit http://localhost:3000/login')
  console.log('2. Test each role with the credentials above')
  console.log('3. Verify sidebar shows different sections per role')
  console.log('4. Check API routes respond appropriately\n')
}

main().catch(console.error)
