/**
 * Verify data exists and can be accessed
 * Run with: npx ts-node scripts/verify-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyData() {
  console.log('🔍 Verifying database data...\n')

  // Check all core tables
  const tables = [
    'profiles',
    'classes',
    'subjects',
    'grades',
    'attendance',
    'semesters'
  ]

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table}: ${count} rows`)
    }
  }

  // Check students specifically
  console.log('\n📊 Student breakdown:')
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
  console.log(`   Students: ${studentCount}`)

  const { count: teacherCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher')
  console.log(`   Teachers: ${teacherCount}`)

  // Check if grades have student_id
  const { count: gradesWithStudent } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .not('student_id', 'is', null)
  console.log(`   Grades with student_id: ${gradesWithStudent}`)

  // Check if grades have class_id
  const { count: gradesWithClass } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .not('class_id', 'is', null)
  console.log(`   Grades with class_id: ${gradesWithClass}`)

  // Sample grades data
  console.log('\n📝 Sample grades:')
  const { data: sampleGrades } = await supabase
    .from('grades')
    .select('id, student_id, class_id, subject_id, score')
    .limit(3)

  sampleGrades?.forEach(g => {
    console.log(`   ${g.id.slice(0, 8)}... student:${g.student_id?.slice(0, 8)} class:${g.class_id?.slice(0, 8)} score:${g.score}`)
  })

  console.log('\n✨ Done!')
}

verifyData().catch(console.error)
