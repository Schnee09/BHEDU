/**
 * Database Audit Script
 * 
 * This script:
 * 1. Audits the current database structure
 * 2. Identifies missing columns by attempting to query them
 * 3. Shows statistics and sample data
 * 4. Generates SQL to fix any issues
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

async function checkColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1)
    return !error
  } catch {
    return false
  }
}

async function auditColumns() {
  console.log('\n� AUDITING PROFILES TABLE COLUMNS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const requiredColumns = [
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
  
  const missingColumns: string[] = []
  
  for (const column of requiredColumns) {
    const exists = await checkColumnExists('profiles', column)
    const status = exists ? '✅' : '❌'
    console.log(`${status} ${column.padEnd(20)} ${exists ? 'EXISTS' : 'MISSING'}`)
    
    if (!exists) {
      missingColumns.push(column)
    }
  }
  
  return missingColumns
}

function generateFixSQL(missingColumns: string[]) {
  if (missingColumns.length === 0) {
    return null
  }
  
  console.log('\n🔧 SQL TO FIX MISSING COLUMNS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('Run this SQL in your Supabase SQL Editor:\n')
  
  const sqlStatements: string[] = []
  
  if (missingColumns.includes('student_code')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_code VARCHAR(50) UNIQUE;')
  }
  if (missingColumns.includes('grade_level')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade_level VARCHAR(20);')
  }
  if (missingColumns.includes('gender')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);')
  }
  if (missingColumns.includes('status')) {
    sqlStatements.push("ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';")
  }
  if (missingColumns.includes('is_active')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;')
  }
  if (missingColumns.includes('photo_url')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;')
  }
  if (missingColumns.includes('enrollment_date')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;')
  }
  if (missingColumns.includes('notes')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;')
  }
  if (missingColumns.includes('department')) {
    sqlStatements.push('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;')
  }
  
  // Add indexes
  sqlStatements.push('\n-- Create indexes for performance')
  sqlStatements.push('CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON profiles(student_code);')
  sqlStatements.push('CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);')
  sqlStatements.push('CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);')
  sqlStatements.push('CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);')
  
  const sql = sqlStatements.join('\n')
  console.log(sql)
  console.log('\n')
  
  return sql
}

async function showStatistics() {
  console.log('\n📈 DATABASE STATISTICS')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // Count students
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
  
  console.log(`Total Students: ${studentCount || 0}`)
  
  // Count teachers
  const { count: teacherCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher')
  
  console.log(`Total Teachers: ${teacherCount || 0}`)
  
  // Count admins
  const { count: adminCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')
  
  console.log(`Total Admins: ${adminCount || 0}`)
  
  // Count classes
  const { count: classCount } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Total Classes: ${classCount || 0}`)
  
  // Count enrollments
  const { count: enrollmentCount } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Total Enrollments: ${enrollmentCount || 0}`)
}

async function showSampleData() {
  console.log('\n🔍 SAMPLE STUDENT DATA')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, student_code, grade_level, gender, status, is_active')
    .eq('role', 'student')
    .limit(3)
  
  if (error) {
    console.log(`❌ Error fetching students: ${error.message}`)
    return
  }
  
  if (!students || students.length === 0) {
    console.log('⚠️  No students found in database')
    console.log('   Consider adding test data or importing real students')
    return
  }
  
  students.forEach((student, index) => {
    console.log(`\nStudent ${index + 1}:`)
    console.log(`  Name: ${student.full_name || 'N/A'}`)
    console.log(`  Email: ${student.email || 'N/A'}`)
    console.log(`  Student Code: ${student.student_code || '❌ MISSING'}`)
    console.log(`  Grade Level: ${student.grade_level || '❌ MISSING'}`)
    console.log(`  Gender: ${student.gender || '❌ MISSING'}`)
    console.log(`  Status: ${student.status || '❌ MISSING'}`)
    console.log(`  Active: ${student.is_active !== null ? student.is_active : '❌ MISSING'}`)
  })
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║        DATABASE AUDIT SCRIPT                              ║')
  console.log('║        BH-EDU Student Management System                   ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')
  
  try {
    // Step 1: Audit columns
    const missingColumns = await auditColumns()
    
    // Step 2: Generate fix SQL if needed
    if (missingColumns.length > 0) {
      generateFixSQL(missingColumns)
    }
    
    // Step 3: Show statistics
    await showStatistics()
    
    // Step 4: Show sample data
    await showSampleData()
    
    console.log('\n✅ AUDIT COMPLETE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    if (missingColumns.length > 0) {
      console.log('⚠️  MISSING COLUMNS DETECTED')
      console.log('   Copy the SQL above and run it in Supabase SQL Editor')
      console.log('   URL: https://supabase.com/dashboard/project/mwncwhkdimnjovxzhtjm/sql\n')
    }
    
    console.log('Next steps:')
    console.log('  1. Fix missing columns (if any)')
    console.log('  2. Update API endpoints to include all fields')
    console.log('  3. Test student CRUD operations')
    
  } catch (error) {
    console.error('\n❌ Error during audit:', error)
    throw error
  }
}

main()
