// Lightweight inspection script to list public tables and sample rows.
// Usage:
// 1. Ensure web/.env.local contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// 2. From repo root run (Windows cmd/powershell):
//    cd web
//    node scripts/inspect-supabase.js

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function listTables() {
  // Query information_schema for public tables
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_schema,table_name,table_type')
    .eq('table_schema', 'public')

  if (error) throw error
  return data.map((r) => r.table_name)
}

async function sampleRows(table, limit = 5) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(limit)
    if (error) return { error: error.message }
    return { rows: data }
  } catch (err) {
    return { error: String(err) }
  }
}

async function run() {
  try {
    console.log('Inspecting Supabase…')
    const tables = await listTables()
    console.log('Found tables:', tables.length)

    // Prioritize common tables used by the app
    const priority = [
      'profiles',
      'classes',
      'enrollments',
      'attendance',
      'grades',
      'assignments',
      'invoices',
      'payments',
      'student_accounts',
      'fee_types',
    ]

    const intersect = priority.filter((t) => tables.includes(t))
    const others = tables.filter((t) => !intersect.includes(t)).slice(0, 20)

    const result = { tables: tables, samples: {} }

    for (const t of intersect.concat(others)) {
      process.stdout.write(`Sampling ${t}... `)
      const sample = await sampleRows(t, 5)
      result.samples[t] = sample
      console.log(sample.error ? `ERROR: ${sample.error}` : `rows=${(sample.rows || []).length}`)
    }

    console.log('\n=== INSPECTION RESULT (JSON) ===\n')
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Failed to inspect Supabase:', err)
    process.exit(2)
  }
}

run()
