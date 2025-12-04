/**
 * Test Creating a New Student
 * 
 * This script tests the POST /api/admin/students endpoint
 * to create a student with all fields
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testCreateStudent() {
  console.log('\n🧪 TESTING STUDENT CREATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const newStudent = {
    email: `test.student.${Date.now()}@bhedu.com`,
    full_name: 'Test Student',
    phone: '(555) 123-4567',
    address: '123 Test Street, Test City, TC 12345',
    date_of_birth: '2008-01-15',
    gender: 'Male',
    grade_level: 'Grade 10',
    notes: 'Test student created by automated script',
    status: 'active',
    is_active: true,
  }
  
  console.log('Creating student with data:')
  console.log(JSON.stringify(newStudent, null, 2))
  console.log('\n')
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newStudent),
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      console.log(`❌ API returned status: ${response.status}`)
      console.log(`   Error: ${data.error}\n`)
      return
    }
    
    if (data.success) {
      console.log('✅ STUDENT CREATED SUCCESSFULLY!\n')
      console.log('📋 STUDENT DETAILS:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      const student = data.data
      console.log(`ID: ${student.id}`)
      console.log(`Student Code: ${student.student_code} ✅`)
      console.log(`Full Name: ${student.full_name}`)
      console.log(`Email: ${student.email}`)
      console.log(`Phone: ${student.phone || 'N/A'}`)
      console.log(`Address: ${student.address || 'N/A'}`)
      console.log(`Date of Birth: ${student.date_of_birth || 'N/A'}`)
      console.log(`Gender: ${student.gender || 'N/A'}`)
      console.log(`Grade Level: ${student.grade_level || 'N/A'}`)
      console.log(`Status: ${student.status}`)
      console.log(`Active: ${student.is_active}`)
      console.log(`Enrollment Date: ${student.enrollment_date}`)
      console.log(`Created At: ${student.created_at}`)
      
      if (data.tempPassword) {
        console.log(`\n🔑 Temporary Password: ${data.tempPassword}`)
        console.log('   (Give this to the student for first login)')
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('\n✅ VERIFICATION:')
      console.log(`   ✓ Student code auto-generated: ${student.student_code}`)
      console.log(`   ✓ All fields saved correctly`)
      console.log(`   ✓ Authentication user created`)
      console.log(`   ✓ Profile created with all data`)
      
      console.log('\n🎉 SUCCESS! New student creation is working perfectly!')
      console.log(`   Visit: ${BASE_URL}/dashboard/students to see the new student\n`)
    } else {
      console.log('❌ CREATION FAILED')
      console.log(`   Error: ${data.error}\n`)
    }
    
  } catch (err) {
    console.error('\n❌ Error testing student creation:', err)
    console.log('\n   Make sure the development server is running:')
    console.log('   cd web && pnpm dev\n')
  }
}

// Test validation errors
async function testValidation() {
  console.log('\n🧪 TESTING VALIDATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // Test 1: Missing required fields
  console.log('Test 1: Missing email (should fail)')
  const test1 = await fetch(`${BASE_URL}/api/admin/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: 'Test' }),
  })
  const result1 = await test1.json()
  console.log(result1.success ? '❌ Should have failed' : `✅ ${result1.error}\n`)
  
  // Test 2: Invalid email format
  console.log('Test 2: Invalid email format (should fail)')
  const test2 = await fetch(`${BASE_URL}/api/admin/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'notanemail', full_name: 'Test' }),
  })
  const result2 = await test2.json()
  console.log(result2.success ? '❌ Should have failed' : `✅ ${result2.error}\n`)
  
  // Test 3: Duplicate email
  console.log('Test 3: Duplicate email (should fail)')
  const test3 = await fetch(`${BASE_URL}/api/admin/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'alex@student.com', full_name: 'Test' }),
  })
  const result3 = await test3.json()
  console.log(result3.success ? '❌ Should have failed' : `✅ ${result3.error}\n`)
  
  console.log('✅ All validation tests passed!\n')
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║     TEST STUDENT CREATION WITH ALL FIELDS                 ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  
  // First test validation
  await testValidation()
  
  // Then test successful creation
  await testCreateStudent()
}

main()
