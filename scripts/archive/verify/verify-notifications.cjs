#!/usr/bin/env node
/**
 * Verify notifications for admin via anon client + login
 * Lists recent notifications visible to admin RLS
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '..', 'web', '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local')
  process.exit(1)
}

const supabase = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })

async function main() {
  async function verifyFor(label, email, password) {
    console.log(`\n🔔 Verifying notifications for ${label} (${email})`)
    const { data: login, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError || !login?.user) {
      console.error(`❌ Login failed for ${label}:`, loginError?.message)
      return
    }
    const { data: rows, error } = await supabase
      .from('notifications')
      .select('id, title, message, read, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) {
      console.error(`❌ Error fetching notifications for ${label}:`, error.message)
      return
    }
    console.log(`✅ Found ${rows.length} notification(s) visible to ${label}`)
    rows.forEach(r => console.log(` - [${r.read ? 'read' : 'unread'}] ${r.title} — ${r.message}`))
    await supabase.auth.signOut()
  }

  await verifyFor('Admin', 'admin@bhedu.example.com', 'Admin123!')
  await verifyFor('Teacher', 'john.doe@bhedu.example.com', 'Teacher123!')
  await verifyFor('Student', 'alice.anderson@student.bhedu.example.com', 'Student123!')
  console.log('\nDone.')
}

main().catch((e) => { console.error('💥 Failed:', e); process.exit(1) })
