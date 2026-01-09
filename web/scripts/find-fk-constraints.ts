/**
 * Find all foreign key constraints and create proper cleanup SQL
 * Run with: npx ts-node scripts/find-fk-constraints.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findConstraints() {
  console.log('🔍 Finding all foreign key constraints on subjects table...\n')

  // Query to find all tables referencing subjects
  const { data: fks, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'subjects'
    `
  })

  if (error) {
    // If RPC doesn't exist, try direct table check
    console.log('Checking known tables for subject references...\n')
    
    const tablesToCheck = [
      'grades', 'timetable_slots', 'curriculum_standards', 'lessons',
      'assignments', 'lesson_plans', 'assessments', 'course_subjects'
    ]

    for (const table of tablesToCheck) {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (!countError) {
        console.log(`✅ ${table}: exists (${count} rows)`)
      } else if (countError.message.includes('does not exist')) {
        console.log(`❌ ${table}: does not exist`)
      } else {
        console.log(`⚠️ ${table}: ${countError.message}`)
      }
    }
  } else {
    console.log('Foreign keys referencing subjects:')
    console.log(JSON.stringify(fks, null, 2))
  }

  // Generate cleanup SQL
  console.log('\n📝 Generating cleanup SQL...\n')
  
  const tables = ['grades', 'timetable_slots', 'curriculum_standards']
  let sql = '-- Auto-generated cleanup SQL\n\n'
  
  for (const table of tables) {
    sql += `-- Clean ${table}\n`
    sql += `DELETE FROM ${table} WHERE subject_id IN (\n`
    sql += `  SELECT id FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC')\n`
    sql += `);\n\n`
  }
  
  sql += `-- Delete extra subjects\n`
  sql += `DELETE FROM subjects WHERE code NOT IN ('TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'KHAC');\n`
  
  console.log(sql)
}

findConstraints().catch(console.error)
