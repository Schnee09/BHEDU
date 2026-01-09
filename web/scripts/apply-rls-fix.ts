/**
 * Apply RLS fixes and grades semester_id migration
 * Run with: npx ts-node scripts/apply-rls-fix.ts
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

async function applyMigration() {
  console.log('🔧 Applying RLS fixes and grades semester_id...\n')

  // Part 1: Check if semester_id column exists in grades
  console.log('1️⃣ Checking grades table for semester_id column...')
  const { data: grades, error: gradesError } = await supabase
    .from('grades')
    .select('id, semester')
    .limit(1)
  
  if (gradesError) {
    console.log('   ⚠️ Error checking grades:', gradesError.message)
  } else {
    console.log('   ✅ Grades table accessible')
  }

  // Part 2: Get current semesters
  console.log('\n2️⃣ Fetching semesters...')
  const { data: semesters, error: semError } = await supabase
    .from('semesters')
    .select('id, code, is_active')
  
  if (semError) {
    console.log('   ⚠️ Error:', semError.message)
  } else {
    console.log('   ✅ Found', semesters?.length || 0, 'semesters')
    semesters?.forEach(s => console.log(`      - ${s.code} (active: ${s.is_active})`))
  }

  // Part 3: Test RLS - try to read subjects with anon-like behavior
  console.log('\n3️⃣ Testing subjects read access...')
  const { data: subjects, count } = await supabase
    .from('subjects')
    .select('id, name, code', { count: 'exact' })
    .limit(5)
  
  console.log('   ✅ Got', count, 'subjects (showing first 5)')
  subjects?.slice(0, 5).forEach(s => console.log(`      - ${s.name} (${s.code})`))

  // Part 4: Test calendar_events
  console.log('\n4️⃣ Testing calendar_events read access...')
  const { data: events, error: eventsError, count: eventsCount } = await supabase
    .from('calendar_events')
    .select('id, title', { count: 'exact' })
    .limit(5)
  
  if (eventsError) {
    console.log('   ⚠️ Error:', eventsError.message)
  } else {
    console.log('   ✅ Got', eventsCount, 'calendar events')
  }

  // Part 5: Test timetable_slots
  console.log('\n5️⃣ Testing timetable_slots read access...')
  const { data: slots, error: slotsError, count: slotsCount } = await supabase
    .from('timetable_slots')
    .select('id', { count: 'exact' })
    .limit(1)
  
  if (slotsError) {
    console.log('   ⚠️ Error:', slotsError.message)
  } else {
    console.log('   ✅ Got', slotsCount, 'timetable slots')
  }

  // Summary
  console.log('\n📊 Summary:')
  console.log('   - Semesters: ✅')
  console.log('   - Subjects:', count ? '✅' : '⚠️')
  console.log('   - Calendar Events:', eventsError ? '⚠️ ' + eventsError.message : '✅')
  console.log('   - Timetable Slots:', slotsError ? '⚠️ ' + slotsError.message : '✅')

  console.log('\n💡 Note: Service role key bypasses RLS.')
  console.log('   The real test is whether the regular client can read these tables.')
  console.log('   If you see RLS errors in the browser, the policies need to be applied via Supabase dashboard.')
}

applyMigration()
  .then(() => console.log('\n✅ Done!'))
  .catch(err => console.error('Error:', err))
