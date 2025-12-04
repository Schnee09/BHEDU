/**
 * Generate Student Codes for Existing Students
 * 
 * This script generates unique student codes for students who don't have one
 * Format: STU-YYYY-NNNN (e.g., STU-2025-0001)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateStudentCode(index: number): string {
  const year = new Date().getFullYear()
  const paddedNumber = String(index).padStart(4, '0')
  return `STU-${year}-${paddedNumber}`
}

async function generateStudentCodes() {
  console.log('\n🎓 GENERATING STUDENT CODES')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  try {
    // First, check if student_code column exists
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('student_code')
      .eq('role', 'student')
      .limit(1)
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('❌ student_code column does not exist yet!')
      console.log('   Please run the SQL from supabase/add-student-code.sql first')
      console.log('   URL: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/sql\n')
      return
    }
    
    // Get all students without student codes
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_code')
      .eq('role', 'student')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching students:', error.message)
      return
    }
    
    if (!students || students.length === 0) {
      console.log('⚠️  No students found in database')
      return
    }
    
    console.log(`Found ${students.length} students\n`)
    
    // Get the highest existing student code number
    let maxNumber = 0
    students.forEach(student => {
      if (student.student_code) {
        const match = student.student_code.match(/STU-\d{4}-(\d{4})/)
        if (match) {
          const num = parseInt(match[1])
          if (num > maxNumber) maxNumber = num
        }
      }
    })
    
    console.log(`Starting from number: ${maxNumber + 1}\n`)
    
    // Generate codes for students without them
    let updated = 0
    let skipped = 0
    let failed = 0
    
    for (const student of students) {
      if (student.student_code) {
        console.log(`⏭️  ${student.full_name || student.email} - Already has code: ${student.student_code}`)
        skipped++
        continue
      }
      
      maxNumber++
      const newCode = generateStudentCode(maxNumber)
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ student_code: newCode })
        .eq('id', student.id)
      
      if (updateError) {
        console.log(`❌ ${student.full_name || student.email} - Failed: ${updateError.message}`)
        failed++
      } else {
        console.log(`✅ ${student.full_name || student.email} → ${newCode}`)
        updated++
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📊 SUMMARY:')
    console.log(`   ✅ Updated: ${updated} students`)
    console.log(`   ⏭️  Skipped: ${skipped} students (already had codes)`)
    if (failed > 0) {
      console.log(`   ❌ Failed: ${failed} students`)
    }
    console.log(`   📝 Total: ${students.length} students\n`)
    
    if (updated > 0) {
      console.log('✅ Student codes generated successfully!')
      console.log('   Visit http://localhost:3000/dashboard/students to see them\n')
    }
    
  } catch (err) {
    console.error('\n❌ Unexpected error:', err)
  }
}

generateStudentCodes()
