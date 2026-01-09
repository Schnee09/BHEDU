/**
 * Create Test Users Script
 * 
 * This script uses Supabase Admin SDK to create test users with auth accounts.
 * Run this AFTER applying migrations and seeding reference data.
 * 
 * Usage:
 *   cd scripts
 *   npx ts-node create-test-users.ts
 * 
 * Or compile and run:
 *   npx tsc create-test-users.ts
 *   node create-test-users.js
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', 'web', '.env.local') })

// Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in web/.env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test user data
const TEST_USERS = {
  admins: [
    { email: 'admin@bhedu.com', name: 'Super Admin', role: 'admin' },
    { email: 'finance@bhedu.com', name: 'Finance Admin', role: 'admin' },
    { email: 'registrar@bhedu.com', name: 'Registrar Admin', role: 'admin' },
  ],
  teachers: [
    { email: 'teacher1@bhedu.com', name: 'John Smith', role: 'teacher' },
    { email: 'teacher2@bhedu.com', name: 'Emily Johnson', role: 'teacher' },
    { email: 'teacher3@bhedu.com', name: 'Michael Brown', role: 'teacher' },
  ],
  students: [
    { email: 'student1@bhedu.com', name: 'Alice Anderson', role: 'student', grade: 'Grade 1', studentId: 'STU-2025-001' },
    { email: 'student2@bhedu.com', name: 'Bob Baker', role: 'student', grade: 'Grade 1', studentId: 'STU-2025-002' },
    { email: 'student3@bhedu.com', name: 'Carol Carter', role: 'student', grade: 'Grade 6', studentId: 'STU-2025-003' },
  ]
}

const DEFAULT_PASSWORD = 'Test123!'

async function createUser(email: string, name: string, role: string, extraData?: any) {
  console.log(`Creating ${role}: ${name} (${email})...`)
  
  try {
    // Try to create auth user (will fail if exists)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name: name }
    })

    let userId: string

    if (authError) {
      // Check if user already exists
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        console.log(`  ⚠️  Auth user already exists, fetching...`)
        
        // Get existing user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        
        if (listError) {
          console.error(`  ❌ Error listing users:`, listError.message)
          return null
        }
        
        const existingUser = users.find(u => u.email === email)
        if (!existingUser) {
          console.error(`  ❌ Could not find existing user`)
          return null
        }
        
        userId = existingUser.id
        console.log(`  ✅ Found existing user (ID: ${userId})`)
      } else {
        console.error(`  ❌ Auth error:`, authError.message)
        return null
      }
    } else {
      if (!authData.user) {
        console.error(`  ❌ No user returned`)
        return null
      }
      userId = authData.user.id
      console.log(`  ✅ Auth user created (ID: ${userId})`)
    }

    // Upsert profile (insert or update if exists)
    const profileData = {
      id: userId,
      email,
      full_name: name,
      role,
      status: 'active',
      ...(role === 'student' && {
        grade_level: extraData?.grade,
        student_id: extraData?.studentId,
        enrollment_date: new Date().toISOString().split('T')[0]
      })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (profileError) {
      console.error(`  ❌ Profile error:`, profileError.message)
      return null
    }

    console.log(`  ✅ Profile synced successfully`)
    return { id: userId, email }
  } catch (error: any) {
    console.error(`  ❌ Error:`, error.message)
    return null
  }
}

async function createTestData() {
  console.log('🚀 Starting test user creation...\n')
  console.log(`📧 Default password for all users: ${DEFAULT_PASSWORD}\n`)

  const createdUsers: any = {
    admins: [],
    teachers: [],
    students: []
  }

  // Create admins
  console.log('👑 Creating admins...')
  for (const admin of TEST_USERS.admins) {
    const user = await createUser(admin.email, admin.name, admin.role)
    if (user) createdUsers.admins.push(user)
  }
  console.log('')

  // Create teachers
  console.log('👨‍🏫 Creating teachers...')
  for (const teacher of TEST_USERS.teachers) {
    const user = await createUser(teacher.email, teacher.name, teacher.role)
    if (user) createdUsers.teachers.push(user)
  }
  console.log('')

  // Create students
  console.log('👨‍🎓 Creating students...')
  for (const student of TEST_USERS.students) {
    const user = await createUser(student.email, student.name, student.role, {
      grade: student.grade,
      studentId: student.studentId
    })
    if (user) createdUsers.students.push(user)
  }
  console.log('')

  // Summary
  console.log('📊 Summary:')
  console.log(`  ✅ Admins: ${createdUsers.admins.length}/${TEST_USERS.admins.length}`)
  console.log(`  ✅ Teachers: ${createdUsers.teachers.length}/${TEST_USERS.teachers.length}`)
  console.log(`  ✅ Students: ${createdUsers.students.length}/${TEST_USERS.students.length}`)
  console.log(`  📧 Default password: ${DEFAULT_PASSWORD}`)
  console.log('')
  console.log('🎉 Done! You can now login with any of the created users.')
  console.log('🌐 Visit: http://localhost:3000/login')
}

// Run the script
createTestData().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
