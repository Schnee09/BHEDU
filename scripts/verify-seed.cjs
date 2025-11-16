#!/usr/bin/env node
/**
 * Verify Seed Data via Cookie/Anon auth (no service role needed)
 * - Tries admin@bhedu.example.com then admin@demo.com
 * - Checks counts in key tables using RLS (admin has read-all)
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Load env from web/.env.local (anon key only)
dotenv.config({ path: path.join(__dirname, '..', 'web', '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local')
  process.exit(1)
}

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const adminCandidates = [
  { email: 'admin@bhedu.example.com', password: 'Admin123!' },
  { email: 'admin@demo.com', password: 'Admin123!' }
]

async function loginAsAdmin() {
  for (const creds of adminCandidates) {
    const { data, error } = await supabase.auth.signInWithPassword(creds)
    if (!error && data?.user) {
      return { ok: true, user: data.user, emailTried: creds.email }
    }
  }
  return { ok: false }
}

async function countRows(table) {
  const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true })
  if (error) return { table, error: error.message }
  return { table, count }
}

async function sampleClasses() {
  const { data, error } = await supabase.from('classes').select('id,name').limit(5)
  if (error) return { error: error.message }
  return data
}

(async () => {
  console.log('🔎 Verifying seed data using anon key + admin login...')
  const login = await loginAsAdmin()
  if (!login.ok) {
    console.error('❌ Unable to sign in as admin with known test credentials (bhedu or demo).')
    console.error('   - Ensure admin user exists and password matches.')
    process.exit(1)
  }
  console.log(`✅ Admin login successful as ${login.emailTried}`)

  const tables = [
    'profiles',
    'classes',
    'enrollments',
    'attendance',
    'assignment_categories',
    'assignments',
    'submissions',
    'scores',
    'grades',
    'student_accounts',
    'invoices',
    'payments',
    'notifications'
  ]

  const results = []
  for (const t of tables) {
    // eslint-disable-next-line no-await-in-loop
    const r = await countRows(t)
    results.push(r)
  }

  console.log('\n📊 Table Counts:')
  for (const r of results) {
    if (r.error) console.log(` - ${r.table}: ERROR - ${r.error}`)
    else console.log(` - ${r.table}: ${r.count}`)
  }

  const classes = await sampleClasses()
  if (classes.error) {
    console.log('\n⚠️ Could not sample classes:', classes.error)
  } else {
    console.log('\n📚 Sample Classes:')
    classes.forEach(c => console.log(` - ${c.name} (${c.id})`))
  }

  console.log('\n✅ Verification completed.')
})().catch((e) => {
  console.error('💥 Verification failed:', e)
  process.exit(1)
})
