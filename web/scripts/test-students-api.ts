/**
 * Test Students API
 * 
 * This script tests the students API endpoint to ensure it returns all required fields
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testStudentsAPI() {
  console.log('\n🧪 TESTING STUDENTS API')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    console.log(`Fetching from: ${BASE_URL}/api/admin/students\n`)
    
    const response = await fetch(`${BASE_URL}/api/admin/students?limit=3`)
    
    if (!response.ok) {
      console.log(`❌ API returned status: ${response.status}`)
      const text = await response.text()
      console.log(`   Response: ${text}\n`)
      return
    }
    
    const data = await response.json()
    
    if (!data.students || data.students.length === 0) {
      console.log('⚠️  No students returned from API\n')
      return
    }
    
    console.log(`✅ API returned ${data.students.length} students`)
    console.log(`   Total count: ${data.totalCount}`)
    console.log(`   Total pages: ${data.totalPages}\n`)
    
    console.log('📋 FIELD VERIFICATION (First Student):')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const student = data.students[0]
    const requiredFields = [
      'id',
      'user_id',
      'email',
      'full_name',
      'role',
      'phone',
      'address',
      'date_of_birth',
      'student_code',
      'grade_level',
      'gender',
      'status',
      'is_active',
      'photo_url',
      'enrollment_date',
      'notes',
      'department',
      'created_at',
      'updated_at',
    ]
    
    let presentFields = 0
    let missingFields = 0
    
    requiredFields.forEach(field => {
      const value = student[field]
      const hasValue = value !== undefined && value !== null
      const status = hasValue ? '✅' : '❌'
      const displayValue = hasValue ? String(value).substring(0, 30) : 'MISSING'
      
      console.log(`${status} ${field.padEnd(20)} ${displayValue}`)
      
      if (hasValue) {
        presentFields++
      } else {
        missingFields++
      }
    })
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📊 RESULTS: ${presentFields}/${requiredFields.length} fields present`)
    
    if (missingFields === 0) {
      console.log('\n✅ SUCCESS! All required fields are returned by the API')
      console.log('   The students page should display correctly now\n')
    } else {
      console.log(`\n⚠️  WARNING: ${missingFields} fields are missing`)
      console.log('   This may cause issues in the UI\n')
    }
    
    // Show all students
    console.log('\n👥 ALL STUDENTS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    data.students.forEach((s: any, i: number) => {
      console.log(`${i + 1}. ${s.full_name || 'No Name'}`)
      console.log(`   Email: ${s.email || 'N/A'}`)
      console.log(`   Code: ${s.student_code || '❌ No Code'}`)
      console.log(`   Grade: ${s.grade_level || '❌ No Grade'}`)
      console.log(`   Status: ${s.status || '❌ No Status'}`)
      console.log(`   Active: ${s.is_active !== undefined ? (s.is_active ? 'Yes' : 'No') : '❌ Unknown'}\n`)
    })
    
    // Show statistics
    if (data.statistics) {
      console.log('📈 STATISTICS:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      console.log(`   Active Students: ${data.statistics.active}`)
      console.log(`   Inactive Students: ${data.statistics.inactive}`)
      console.log(`   Total Classes: ${data.statistics.totalClasses}`)
      console.log(`   Average Attendance: ${data.statistics.averageAttendance}%`)
      console.log(`   New This Month: ${data.statistics.newThisMonth}\n`)
    }
    
  } catch (err) {
    console.error('\n❌ Error testing API:', err)
    console.log('\n   Make sure the development server is running:')
    console.log('   cd web && pnpm dev\n')
  }
}

testStudentsAPI()
