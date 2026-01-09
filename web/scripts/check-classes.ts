/**
 * Check and clean old classes
 * Run with: npx ts-node scripts/check-classes.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Classes we want to keep (from seed.sql)
const VALID_CLASSES = [
  '10A1', '10A2', '10A3',
  '11A1', '11A2', '11A3',
  '12A1', '12A2', '12A3',
  '6A', '6B',
  '7A', '7B',
  '8A', '8B',
  '9A', '9B'
]

async function checkClasses() {
  console.log('📚 Checking classes...\n')

  const { data: classes, count } = await supabase
    .from('classes')
    .select('id, name', { count: 'exact' })
    .order('name')

  console.log(`Total classes: ${count}\n`)

  const validClasses = classes?.filter(c => VALID_CLASSES.includes(c.name)) || []
  const oldClasses = classes?.filter(c => !VALID_CLASSES.includes(c.name)) || []

  console.log('✅ Valid classes:')
  validClasses.forEach(c => console.log(`   - ${c.name}`))

  console.log(`\n⚠️ Old classes (${oldClasses.length}):`)
  oldClasses.slice(0, 20).forEach(c => console.log(`   - ${c.name}`))
  if (oldClasses.length > 20) console.log(`   ... and ${oldClasses.length - 20} more`)

  // Print SQL to delete old classes
  if (oldClasses.length > 0) {
    console.log('\n📝 SQL to delete old classes:')
    console.log('---')
    console.log(`-- Delete related data first`)
    console.log(`DELETE FROM grades WHERE class_id NOT IN (SELECT id FROM classes WHERE name IN ('${VALID_CLASSES.join("','")}'));`)
    console.log(`DELETE FROM attendance WHERE class_id NOT IN (SELECT id FROM classes WHERE name IN ('${VALID_CLASSES.join("','")}'));`)
    console.log(`DELETE FROM timetable_slots WHERE class_id NOT IN (SELECT id FROM classes WHERE name IN ('${VALID_CLASSES.join("','")}'));`)
    console.log(`-- Delete old classes`)
    console.log(`DELETE FROM classes WHERE name NOT IN ('${VALID_CLASSES.join("','")}');`)
  }
}

checkClasses().catch(console.error)
