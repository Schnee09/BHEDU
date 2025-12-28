// List classes to choose a target class_id
// Usage: node scripts/list-classes.js
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// Attempt loading env from multiple locations
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
  console.error('   Set them, or export in shell, then re-run.')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  console.log('\n🏫 Listing classes...')
  const { data, error } = await supabase
    .from('classes')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) {
    console.error('❌ Error fetching classes:', error)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No classes found.')
    return
  }

  for (const cls of data) {
    console.log(`- id=${cls.id}  name=${cls.name || ''}`)
  }

  console.log('\n👉 Copy the desired class_id and run:')
  console.log('   node scripts/seed-grade-categories.js <class_id>')
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e)
  process.exit(1)
})
