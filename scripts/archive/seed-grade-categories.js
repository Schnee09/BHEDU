// Seed grade_categories for a given class with Vietnamese subject codes
// Usage: node scripts/seed-grade-categories.js <class_id>
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// Attempt loading env from multiple locations
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: 'web/.env' })
require('dotenv').config({ path: 'web/.env.local' })
require('dotenv').config({ path: 'supabase/.env' })
const { createClient } = require('@supabase/supabase-js')

const requiredEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`❌ Missing env: ${key}`)
  }
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing env NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Tried paths: .env, web/.env, web/.env.local, supabase/.env')
  console.error('   Set them, or export in shell, then re-run.')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const SUBJECTS = [
  { code: 'TOAN', name: 'Toán học' },
  { code: 'LY', name: 'Vật lý' },
  { code: 'HOA', name: 'Hóa học' },
  { code: 'VAN', name: 'Ngữ văn' },
  { code: 'ANH', name: 'Tiếng Anh' },
  { code: 'KHTN', name: 'Khoa học tự nhiên' },
]

async function ensureClassExists(classId) {
  const { data, error } = await supabase.from('classes').select('id, name, code').eq('id', classId).maybeSingle()
  if (error) {
    console.error('❌ Error checking class:', error)
    process.exit(1)
  }
  if (!data) {
    console.error(`❌ Class not found: ${classId}`)
    process.exit(1)
  }
  console.log(`🏷️  Class: ${data.name || data.id} (${data.code || classId})`)
}

async function upsertGradeCategory(classId, subject) {
  // Upsert by composite unique key (class_id, code) if available
  const payload = { class_id: classId, code: subject.code, name: subject.name }
  const { data, error } = await supabase
    .from('grade_categories')
    .upsert(payload, { onConflict: 'class_id,code' })
    .select('id, class_id, code, name')

  if (error) {
    const msg = error.message || ''
    if (error.code === '42P01' || msg.includes('does not exist') || msg.includes('relation "grade_categories"')) {
      console.error('❌ Table grade_categories not found.')
      console.error('   Please ensure your Supabase has a table with at least:')
      console.error('   id uuid default gen_random_uuid() primary key, class_id uuid references classes(id), code text, name text, unique (class_id, code)')
      console.error('   After creating, re-run this script.')
      process.exit(1)
    }
    console.error(`❌ Upsert error for ${subject.code}:`, error)
    return { created: 0, updated: 0 }
  }

  const row = Array.isArray(data) ? data[0] : data
  console.log(`✅ Category ${subject.code} → id=${row?.id || 'n/a'}`)
  return { created: 1, updated: 0 }
}

async function main() {
  const classId = process.argv[2]
  if (!classId) {
    console.log('Usage: node scripts/seed-grade-categories.js <class_id>')
    process.exit(1)
  }

  console.log('\n📚 Seeding grade categories for class:', classId)
  await ensureClassExists(classId)

  let ok = 0
  for (const subject of SUBJECTS) {
    const res = await upsertGradeCategory(classId, subject)
    ok += res.created
  }

  console.log(`\n✨ Done. Categories processed: ${SUBJECTS.length}, successful: ${ok}`)
  console.log('ℹ️  These categories enable Vietnamese grade entry to save assignments/grades per subject.')
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e)
  process.exit(1)
})
