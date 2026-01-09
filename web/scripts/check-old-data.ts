/**
 * Check for old data in Supabase that doesn't match new structure
 * Run with: npx ts-node scripts/check-old-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkOldData() {
  console.log('🔍 Checking for old data in Supabase\n')
  console.log('='.repeat(60))

  const issues: string[] = []

  // 1. Check subjects - should only have 6
  console.log('\n📚 SUBJECTS')
  const { data: subjects, count: subjectCount } = await supabase
    .from('subjects')
    .select('id, name, code', { count: 'exact' })

  console.log(`   Total: ${subjectCount}`)
  
  const validCodes = ['TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC']
  const invalidSubjects = subjects?.filter(s => !validCodes.includes(s.code)) || []
  
  if (invalidSubjects.length > 0) {
    console.log(`   ⚠️ Found ${invalidSubjects.length} subjects with non-standard codes:`)
    invalidSubjects.forEach(s => console.log(`      - ${s.name} (${s.code})`))
    issues.push(`${invalidSubjects.length} subjects with old codes`)
  } else {
    console.log('   ✅ All subjects have valid codes')
  }

  // 2. Check profiles - old school name references?
  console.log('\n👤 PROFILES')
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
  
  const { count: teacherCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher')

  const { count: studentsWithEmail } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .not('email', 'is', null)

  console.log(`   Total profiles: ${profileCount}`)
  console.log(`   Students: ${studentCount}`)
  console.log(`   Teachers: ${teacherCount}`)
  console.log(`   Students with email: ${studentsWithEmail}`)
  
  if (studentsWithEmail && studentsWithEmail > 0) {
    console.log(`   ⚠️ ${studentsWithEmail} students have email (old structure)`)
    issues.push(`${studentsWithEmail} students with email`)
  }

  // 3. Check student codes - format HSYYYYNNN
  console.log('\n🆔 STUDENT CODES')
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, student_code')
    .eq('role', 'student')
  
  const validCodePattern = /^HS\d{4}\d{3}$/
  const invalidCodes = students?.filter(s => s.student_code && !validCodePattern.test(s.student_code)) || []
  
  if (invalidCodes.length > 0) {
    console.log(`   ⚠️ Found ${invalidCodes.length} students with invalid code format:`)
    invalidCodes.slice(0, 10).forEach(s => console.log(`      - ${s.full_name}: ${s.student_code}`))
    if (invalidCodes.length > 10) console.log(`      ... and ${invalidCodes.length - 10} more`)
    issues.push(`${invalidCodes.length} students with old code format`)
  } else {
    console.log('   ✅ All student codes are valid')
  }

  // 4. Check grades - should have subject_id and class_id
  console.log('\n📊 GRADES')
  const { count: gradeCount } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
  
  const { count: gradesNoSubject } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .is('subject_id', null)
  
  const { count: gradesNoClass } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .is('class_id', null)

  console.log(`   Total grades: ${gradeCount}`)
  console.log(`   Without subject_id: ${gradesNoSubject}`)
  console.log(`   Without class_id: ${gradesNoClass}`)
  
  if (gradesNoSubject && gradesNoSubject > 0) {
    issues.push(`${gradesNoSubject} grades without subject_id`)
  }
  if (gradesNoClass && gradesNoClass > 0) {
    issues.push(`${gradesNoClass} grades without class_id`)
  }

  // 5. Check school_settings
  console.log('\n⚙️ SCHOOL SETTINGS')
  const { data: settings } = await supabase
    .from('school_settings')
    .select('key, value')
  
  const schoolName = settings?.find(s => s.key === 'school_name')?.value
  console.log(`   school_name: ${schoolName || '(not set)'}`)
  
  if (schoolName && !schoolName.includes('Bùi Hoàng')) {
    console.log('   ⚠️ School name doesn\'t match new branding')
    issues.push('School name needs update')
  }

  // 6. Check semesters
  console.log('\n📅 SEMESTERS')
  const { data: semesters, count: semesterCount } = await supabase
    .from('semesters')
    .select('id, name, code, is_active', { count: 'exact' })
  
  console.log(`   Total: ${semesterCount}`)
  semesters?.forEach(s => console.log(`   - ${s.name} (${s.code}) - Active: ${s.is_active}`))

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📋 SUMMARY')
  
  if (issues.length === 0) {
    console.log('   ✅ No old data issues found!')
  } else {
    console.log(`   ⚠️ Found ${issues.length} issues:`)
    issues.forEach(i => console.log(`      - ${i}`))
  }

  console.log('\n✨ Check complete!')
}

checkOldData().catch(console.error)
