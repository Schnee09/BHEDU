#!/usr/bin/env node
/**
 * Create Test Users in Supabase Auth
 * Run this before running the seed SQL script
 * Usage: node scripts/create-test-users.cjs
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables from backend/.env (server secrets) first,
// then web/.env.local (public values). Later calls do not overwrite existing vars.
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') })
dotenv.config({ path: path.join(__dirname, '..', 'web', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\n💡 Make sure web/.env.local exists and contains these variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  // Admin
  {
    email: 'admin@bhedu.example.com',
    password: 'Admin123!',
    role: 'admin',
    name: 'System Administrator'
  },
  
  // Teachers
  {
    email: 'john.doe@bhedu.example.com',
    password: 'Teacher123!',
    role: 'teacher',
    name: 'John Doe'
  },
  {
    email: 'emily.johnson@bhedu.example.com',
    password: 'Teacher123!',
    role: 'teacher',
    name: 'Emily Johnson'
  },
  {
    email: 'michael.brown@bhedu.example.com',
    password: 'Teacher123!',
    role: 'teacher',
    name: 'Michael Brown'
  },
  {
    email: 'sarah.davis@bhedu.example.com',
    password: 'Teacher123!',
    role: 'teacher',
    name: 'Sarah Davis'
  },
  
  // Students
  {
    email: 'alice.anderson@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'Alice Anderson'
  },
  {
    email: 'bob.martinez@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'Bob Martinez'
  },
  {
    email: 'charlie.wilson@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'Charlie Wilson'
  },
  {
    email: 'diana.lee@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'Diana Lee'
  },
  {
    email: 'ethan.taylor@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'Ethan Taylor'
  },
  {
    email: 'fiona.garcia@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'Fiona Garcia'
  },
  {
    email: 'george.harris@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'George Harris'
  },
  {
    email: 'hannah.clark@student.bhedu.example.com',
    password: 'Student123!',
    role: 'student',
    name: 'Hannah Clark'
  }
]

async function createTestUsers() {
  console.log('🚀 Creating test users in Supabase Auth...\n')
  
  const results = {
    created: [],
    existing: [],
    errors: []
  }

  for (const user of testUsers) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          role: user.role
        }
      })

      if (error) {
        if (error.message.includes('already exists') || error.message.includes('already registered')) {
          results.existing.push(user.email)
          console.log(`⚠️  ${user.email} - Already exists`)
        } else {
          results.errors.push({ email: user.email, error: error.message })
          console.log(`❌ ${user.email} - Error: ${error.message}`)
        }
      } else {
        results.created.push(user.email)
        console.log(`✅ ${user.email} - Created (ID: ${data.user.id})`)
      }
    } catch (err) {
      results.errors.push({ email: user.email, error: err.message })
      console.log(`❌ ${user.email} - Exception: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log('='.repeat(60))
  console.log(`✅ Created: ${results.created.length}`)
  console.log(`⚠️  Already Existed: ${results.existing.length}`)
  console.log(`❌ Errors: ${results.errors.length}`)
  console.log('='.repeat(60))

  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:')
    results.errors.forEach(({ email, error }) => {
      console.log(`   ${email}: ${error}`)
    })
  }

  if (results.created.length > 0 || results.existing.length > 0) {
    console.log('\n✨ Next steps:')
    console.log('   1. Run the seed SQL script:')
    console.log('      cd web')
    console.log('      npx supabase db reset')
    console.log('\n   2. Test login with these credentials:')
    console.log('      Admin:   admin@bhedu.example.com / Admin123!')
    console.log('      Teacher: john.doe@bhedu.example.com / Teacher123!')
    console.log('      Student: alice.anderson@student.bhedu.example.com / Student123!')
  }

  console.log('\n')
  return results
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('✨ Done!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('💥 Fatal error:', err)
    process.exit(1)
  })
