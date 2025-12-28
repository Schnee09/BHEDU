// Seed grade_categories for ALL classes with Vietnamese subject codes
// Usage: node scripts/seed-grade-categories-all.js
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// Load env from multiple locations
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: 'web/.env' })
require('dotenv').config({ path: 'web/.env.local' })
require('dotenv').config({ path: 'supabase/.env' })

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('❌ Missing env NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Tried paths: .env, web/.env, web/.env.local, supabase/.env')
  process.exit(1)
}

const supabase = createClient(url, key)

const SUBJECTS = [
  { code: 'TOAN', name: 'Toán học' },
  { code: 'LY', name: 'Vật lý' },
  { code: 'HOA', name: 'Hóa học' },
  { code: 'VAN', name: 'Ngữ văn' },
  { code: 'ANH', name: 'Tiếng Anh' },
  { code: 'KHTN', name: 'Khoa học tự nhiên' },
]

async function assertGradeCategoriesExists() {
  const { error } = await supabase.from('grade_categories').select('id').limit(1)
  if (error) {
    const msg = error.message || ''
    if (error.code === '42P01' || msg.includes('does not exist')) {
      console.error('❌ Table grade_categories not found.')
      console.error(`   Please create table:
   CREATE TABLE IF NOT EXISTS public.grade_categories (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     class_id uuid REFERENCES public.classes(id),
     code text NOT NULL,
     name text,
     UNIQUE (class_id, code)
   );`)
      process.exit(1)
    }
  }
}

async function getAllClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

async function upsertCategory(classId, subject) {
  const payload = { class_id: classId, code: subject.code, name: subject.name }
  const { data, error } = await supabase
    .from('grade_categories')
    .upsert(payload, { onConflict: 'class_id,code' })
    .select('id')
  if (error) {
    console.error(`   ❌ ${subject.code} → ${error.message}`)
    return false
  }
  console.log(`   ✅ ${subject.code}`)
  return true
}

async function main() {
  console.log('\n📚 Seeding grade categories for ALL classes...')
  await assertGradeCategoriesExists()

  const classes = await getAllClasses()
  if (classes.length === 0) {
    console.log('ℹ️  No classes found. Nothing to seed.')
    return
  }

  let totalOk = 0
  for (const cls of classes) {
    console.log(`\n🏫 Class: ${cls.name || ''} (${cls.id})`)
    for (const subj of SUBJECTS) {
      const ok = await upsertCategory(cls.id, subj)
      if (ok) totalOk++
    }
  }

  console.log(`\n✨ Done. Categories upserted successfully: ${totalOk} (across ${classes.length} classes)`) 
  console.log('ℹ️  Now verify the grade entry UI lists only your six subjects and saving works.')
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e)
  process.exit(1)
})
