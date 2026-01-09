/**
 * Analyze Supabase database structure and identify unused tables
 * Run with: npx ts-node scripts/analyze-database.ts
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

// Tables we know are actively used by frontend
const ACTIVE_TABLES = [
  'profiles',
  'classes', 
  'subjects',
  'grades',
  'attendance',
  'semesters',
  'timetable_slots',
  'calendar_events',
  'fee_types',
  'academic_years',
  'school_settings'
]

// Tables that might be legacy/unused
const POTENTIALLY_UNUSED = [
  'courses',
  'lessons', 
  'assignments',
  'assignment_categories',
  'grade_categories',
  'enrollments',
  'guardians',
  'invoices',
  'payments',
  'payment_schedules',
  'payment_methods',
  'grading_scales',
  'audit_logs',
  'report_exports',
  'notifications',
  'user_permissions'
]

async function analyzeDatabase() {
  console.log('🔍 Analyzing Supabase Database Structure\n')
  console.log('=' .repeat(60))

  // Check each table for row count
  const results: { table: string; count: number | null; status: string }[] = []

  const allTables = [...ACTIVE_TABLES, ...POTENTIALLY_UNUSED]

  for (const table of allTables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      results.push({ table, count: null, status: '❌ Error: ' + error.message })
    } else {
      const isActive = ACTIVE_TABLES.includes(table)
      const status = count === 0 
        ? (isActive ? '⚠️ Empty (Active Table)' : '🗑️ Empty (Can Remove)')
        : (isActive ? '✅ Active' : '⚠️ Has Data')
      results.push({ table, count, status })
    }
  }

  // Print results
  console.log('\n📊 Table Analysis:\n')
  console.log('Table'.padEnd(25) + 'Rows'.padStart(10) + '   Status')
  console.log('-'.repeat(60))

  for (const r of results.sort((a, b) => (b.count || 0) - (a.count || 0))) {
    const countStr = r.count !== null ? r.count.toString() : 'N/A'
    console.log(r.table.padEnd(25) + countStr.padStart(10) + '   ' + r.status)
  }

  // Summary
  const empty = results.filter(r => r.count === 0)
  const errors = results.filter(r => r.count === null)
  const withData = results.filter(r => r.count && r.count > 0)

  console.log('\n' + '='.repeat(60))
  console.log('📈 Summary:')
  console.log(`   Tables with data: ${withData.length}`)
  console.log(`   Empty tables: ${empty.length}`)
  console.log(`   Errors/Missing: ${errors.length}`)

  // Recommendations
  console.log('\n💡 Recommendations:')
  const toRemove = empty.filter(r => !ACTIVE_TABLES.includes(r.table))
  if (toRemove.length > 0) {
    console.log('   Tables safe to remove:')
    toRemove.forEach(r => console.log(`     - ${r.table}`))
  }

  const errorTables = errors.map(r => r.table)
  if (errorTables.length > 0) {
    console.log('   Tables that don\'t exist (already cleaned):')
    errorTables.forEach(t => console.log(`     - ${t}`))
  }
}

analyzeDatabase()
  .then(() => console.log('\n✅ Analysis complete!'))
  .catch(err => console.error('Error:', err))
