// Apply a SQL migration file via Supabase REST RPC (if available)
// Usage: node scripts/apply-sql-file.js supabase/migrations/20251220121500_grade_categories.sql

require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: 'web/.env' })
require('dotenv').config({ path: 'web/.env.local' })
require('dotenv').config({ path: 'supabase/.env' })

const fs = require('fs')
const path = require('path')

async function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: node scripts/apply-sql-file.js <path-to-sql>')
    process.exit(1)
  }
  const sqlPath = path.resolve(fileArg)
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ File not found:', sqlPath)
    process.exit(1)
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing env NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  console.log(`📄 Loaded SQL (${sql.length} bytes): ${sqlPath}`)

  const statements = sql
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📋 Executing ${statements.length} statements via RPC (if available)...`) 

  let ok = 0
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: stmt }),
      })
      if (res.ok) {
        console.log(`✅ ${i + 1}/${statements.length}: ${preview}...`)
        ok++
      } else {
        const text = await res.text()
        console.log(`❌ ${i + 1}/${statements.length}: ${preview}...`)
        console.log(`   Error: ${text.substring(0, 120)}`)
        if (text.includes('exec_sql')) {
          console.log('\n⚠️  RPC function exec_sql not available in your project.')
          console.log('   Please run this migration manually in Supabase SQL Editor:')
          console.log(`   ${sqlPath}`)
          break
        }
      }
    } catch (e) {
      console.log(`❌ ${i + 1}/${statements.length}: ${e.message}`)
    }
  }

  if (ok === statements.length) {
    console.log('\n✨ Migration applied successfully.')
  } else {
    console.log('\nℹ️  Partial or no execution via API. Manual run may be required.')
  }
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e)
  process.exit(1)
})
