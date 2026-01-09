/**
 * Complete Seed Script for BH-EDU
 * Creates sample data including grades and attendance
 * 
 * Run with: npx ts-node scripts/seed-new.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Vietnamese names for random generation
const FIRST_NAMES = ['Minh', 'Hải', 'Dũng', 'Anh', 'Tuấn', 'Nam', 'Đức', 'Phong', 'Lan', 'Hương', 'Mai', 'Linh', 'Thảo', 'Hà', 'Ngọc']
const LAST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Đặng', 'Bùi']

// Grade components based on Vietnamese education
const COMPONENTS = ['oral', 'fifteen_min', 'one_period', 'midterm', 'final']
const SEMESTERS = ['1', '2']

function randomName(): string {
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  const middle = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  return `${last} ${middle} ${first}`
}

function randomScore(): number {
  // Generate score between 5.0 and 10.0, rounded to 1 decimal
  return Math.round((Math.random() * 5 + 5) * 10) / 10
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString().split('T')[0]
}

async function main() {
  console.log('🌱 BH-EDU Complete Seed\n')
  console.log('='.repeat(50))

  // 1. Get existing data
  console.log('\n📊 Checking existing data...')
  
  const { data: subjects } = await supabase.from('subjects').select('id, code, name')
  console.log(`   Subjects: ${subjects?.length || 0}`)
  
  const { data: classes } = await supabase.from('classes').select('id, name')
  console.log(`   Classes: ${classes?.length || 0}`)
  
  const { data: existingStudents, count: studentCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact' })
    .eq('role', 'student')
  console.log(`   Students: ${studentCount || 0}`)

  if (!subjects?.length || !classes?.length) {
    console.log('\n⚠️ Run supabase/seed.sql first to create subjects and classes!')
    return
  }

  // 2. Create students if needed
  const STUDENTS_PER_CLASS = 15
  const TOTAL_STUDENTS = classes.length * STUDENTS_PER_CLASS

  if ((studentCount || 0) < TOTAL_STUDENTS) {
    console.log(`\n👨‍🎓 Creating ${TOTAL_STUDENTS - (studentCount || 0)} students...`)
    
    let studentNum = (studentCount || 0) + 1
    for (const cls of classes) {
      const gradeLevel = `Lớp ${cls.name.match(/\d+/)?.[0] || '10'}`
      
      for (let i = 0; i < STUDENTS_PER_CLASS; i++) {
        // Student code format: HSYYYYNNN (e.g., HS2025001)
        const currentYear = new Date().getFullYear()
        const code = `HS${currentYear}${String(studentNum).padStart(3, '0')}`
        const gender = Math.random() > 0.5 ? 'male' : 'female'
        
        const { error } = await supabase.from('profiles').insert({
          full_name: randomName(),
          email: `hs${String(studentNum).padStart(4, '0')}@bhedu.vn`,
          role: 'student',
          status: 'active',
          grade_level: gradeLevel,
          gender,
          student_code: code,
        })
        
        if (!error) studentNum++
      }
      process.stdout.write('.')
    }
    console.log(` Created ${studentNum - (studentCount || 0) - 1} students`)
  }

  // 3. Get all students now
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, grade_level')
    .eq('role', 'student')
    .limit(200)

  if (!students?.length) {
    console.log('❌ No students found')
    return
  }

  // 4. Create sample grades
  console.log('\n📝 Creating sample grades...')
  let gradesCreated = 0
  const CORE_SUBJECTS = ['TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC']
  const coreSubjects = subjects.filter(s => CORE_SUBJECTS.includes(s.code))
  
  // Check existing grades
  const { count: existingGrades } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
  
  if ((existingGrades || 0) > 1000) {
    console.log(`   Already have ${existingGrades} grades, skipping...`)
  } else {
    for (const student of students.slice(0, 50)) { // First 50 students
      const classMatch = student.grade_level?.match(/\d+/)
      const classNum = classMatch ? classMatch[0] : '10'
      const matchingClass = classes.find(c => c.name.startsWith(classNum))
      
      if (!matchingClass) continue
      
      for (const subject of coreSubjects) {
        for (const semester of SEMESTERS) {
          for (const component of COMPONENTS) {
            if (Math.random() > 0.2) { // 80% chance
              await supabase.from('grades').insert({
                student_id: student.id,
                class_id: matchingClass.id,
                subject_id: subject.id,
                component_type: component,
                semester,
                score: randomScore(),
                points_earned: randomScore(),
              })
              gradesCreated++
            }
          }
        }
      }
      process.stdout.write('.')
    }
    console.log(` Created ${gradesCreated} grades`)
  }

  // 5. Create sample attendance
  console.log('\n📋 Creating sample attendance...')
  const { count: existingAttendance } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
  
  if ((existingAttendance || 0) > 500) {
    console.log(`   Already have ${existingAttendance} attendance records, skipping...`)
  } else {
    const startDate = new Date('2024-09-05')
    const endDate = new Date()
    let attendanceCreated = 0
    
    for (const cls of classes.slice(0, 5)) { // First 5 classes
      const classStudents = students.filter(s => 
        s.grade_level?.includes(cls.name.match(/\d+/)?.[0] || '')
      ).slice(0, 10)
      
      // Create 30 days of attendance
      for (let d = 0; d < 30; d++) {
        const date = randomDate(startDate, endDate)
        
        for (const student of classStudents) {
          const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'late' : 'absent')
          
          await supabase.from('attendance').insert({
            student_id: student.id,
            class_id: cls.id,
            date,
            status,
          })
          attendanceCreated++
        }
      }
      process.stdout.write('.')
    }
    console.log(` Created ${attendanceCreated} attendance records`)
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Final Summary:')
  
  const { count: finalStudents } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student')
  const { count: finalGrades } = await supabase.from('grades').select('*', { count: 'exact', head: true })
  const { count: finalAttendance } = await supabase.from('attendance').select('*', { count: 'exact', head: true })
  
  console.log(`   Students: ${finalStudents}`)
  console.log(`   Grades: ${finalGrades}`)
  console.log(`   Attendance: ${finalAttendance}`)
  console.log(`   Subjects: ${subjects.length}`)
  console.log(`   Classes: ${classes.length}`)
  
  console.log('\n✨ Done!')
}

main().catch(console.error)
