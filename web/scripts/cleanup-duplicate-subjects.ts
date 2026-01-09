/**
 * Script to clean up duplicate subjects in the database
 * Run with: npx ts-node scripts/cleanup-duplicate-subjects.ts
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

async function cleanupDuplicateSubjects() {
  console.log('🔍 Fetching all subjects...')
  
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name, code, created_at')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching subjects:', error)
    return
  }
  
  console.log(`Found ${subjects?.length || 0} subjects`)
  
  // Build map of code -> canonical subject (first/oldest)
  const canonicalMap = new Map<string, string>()
  const duplicates: { id: string, code: string, name: string }[] = []
  
  for (const subject of subjects || []) {
    const lowerCode = subject.code?.toLowerCase()
    if (!lowerCode) continue
    
    if (!canonicalMap.has(lowerCode)) {
      canonicalMap.set(lowerCode, subject.id)
    } else {
      duplicates.push({ id: subject.id, code: subject.code, name: subject.name })
    }
  }
  
  console.log(`Canonical subjects: ${canonicalMap.size}`)
  console.log(`Duplicates to remove: ${duplicates.length}`)
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!')
    return
  }
  
  // Update foreign key references for each duplicate
  for (const dup of duplicates) {
    const canonicalId = canonicalMap.get(dup.code.toLowerCase())!
    console.log(`\n📝 Migrating references from ${dup.name} (${dup.id}) to canonical (${canonicalId})`)
    
    // Update grades
    const { error: gradesError, count: gradesCount } = await supabase
      .from('grades')
      .update({ subject_id: canonicalId })
      .eq('subject_id', dup.id)
    
    if (gradesError) {
      console.log(`  ⚠️ Failed to update grades: ${gradesError.message}`)
    } else {
      console.log(`  ✅ Updated grades: ${gradesCount || 0} rows`)
    }
    
    // Update timetable_slots
    const { error: timetableError, count: timetableCount } = await supabase
      .from('timetable_slots')
      .update({ subject_id: canonicalId })
      .eq('subject_id', dup.id)
    
    if (timetableError) {
      console.log(`  ⚠️ Failed to update timetable_slots: ${timetableError.message}`)
    } else {
      console.log(`  ✅ Updated timetable_slots: ${timetableCount || 0} rows`)
    }
    
    // Update assignments (if exists)
    const { error: assignmentsError } = await supabase
      .from('assignments')
      .update({ subject_id: canonicalId })
      .eq('subject_id', dup.id)
    
    if (!assignmentsError) {
      console.log(`  ✅ Updated assignments`)
    }
  }
  
  // Delete duplicates
  console.log('\n🗑️ Deleting duplicate subjects...')
  const duplicateIds = duplicates.map(d => d.id)
  
  const { error: deleteError, count: deleteCount } = await supabase
    .from('subjects')
    .delete()
    .in('id', duplicateIds)
  
  if (deleteError) {
    console.error('Failed to delete duplicates:', deleteError)
  } else {
    console.log(`✅ Deleted ${deleteCount || duplicateIds.length} duplicate subjects`)
  }
  
  // Final count
  const { count: finalCount } = await supabase
    .from('subjects')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 Final subject count: ${finalCount}`)
}

cleanupDuplicateSubjects()
  .then(() => console.log('\n✅ Done!'))
  .catch(err => console.error('Error:', err))
