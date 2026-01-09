/**
 * Analyze current schema structure
 * Run with: npx ts-node scripts/analyze-schema.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Tables we expect to be actively used
const CORE_TABLES = [
  'profiles',
  'classes', 
  'subjects',
  'grades',
  'attendance',
  'semesters',
  'timetable_slots',
  'calendar_events',
  'school_settings',
  'academic_years',
  'fee_types'
]

// Tables that might be legacy/can be removed
const CHECK_TABLES = [
  'courses',
  'lessons', 
  'assignments',
  'curriculum_standards',
  'subject_group_subjects',
  'enrollments',
  'guardians',
  'invoices',
  'payments',
  'payment_schedules',
  'payment_methods',
  'grading_scales',
  'audit_logs',
  'report_exports',
  'notifications'
]

async function analyzeSchema() {
  console.log('📊 Schema Analysis\n')
  console.log('='.repeat(60))

  // Check core tables
  console.log('\n🔹 CORE TABLES (Actively Used)')
  console.log('-'.repeat(40))
  
  for (const table of CORE_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ ${table.padEnd(20)} Error: ${error.message.slice(0, 30)}`)
    } else {
      console.log(`   ✅ ${table.padEnd(20)} ${String(count).padStart(6)} rows`)
    }
  }

  // Check legacy tables
  console.log('\n🔸 LEGACY TABLES (Check if needed)')
  console.log('-'.repeat(40))
  
  const legacyWithData: string[] = []
  const legacyEmpty: string[] = []
  const legacyMissing: string[] = []
  
  for (const table of CHECK_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      if (error.message.includes('does not exist')) {
        legacyMissing.push(table)
      } else {
        console.log(`   ⚠️ ${table.padEnd(20)} Error: ${error.message.slice(0, 30)}`)
      }
    } else if (count === 0) {
      legacyEmpty.push(table)
    } else {
      legacyWithData.push(`${table} (${count})`)
    }
  }
  
  if (legacyWithData.length > 0) {
    console.log('   Tables with data:')
    legacyWithData.forEach(t => console.log(`      ⚠️ ${t}`))
  }
  
  if (legacyEmpty.length > 0) {
    console.log('   Empty tables (safe to drop):')
    legacyEmpty.forEach(t => console.log(`      🗑️ ${t}`))
  }
  
  if (legacyMissing.length > 0) {
    console.log('   Already removed:')
    legacyMissing.forEach(t => console.log(`      ✅ ${t}`))
  }

  // Check indexes
  console.log('\n📈 RECOMMENDATIONS')
  console.log('-'.repeat(40))
  
  const { count: gradeCount } = await supabase.from('grades').select('*', { count: 'exact', head: true })
  const { count: attendanceCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true })
  
  if ((gradeCount || 0) < 100) {
    console.log('   💡 grades table has few rows - run seed script for sample data')
  }
  
  if (legacyEmpty.length > 0) {
    console.log(`   💡 ${legacyEmpty.length} empty tables could be dropped`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Analysis complete!')
}

analyzeSchema().catch(console.error)
