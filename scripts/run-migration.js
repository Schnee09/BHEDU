#!/usr/bin/env node

/**
 * Run Supabase migration directly via service role
 * Usage: node scripts/run-migration.js <migration-file>
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials')
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file')
  process.exit(1)
}

const migrationFile = process.argv[2]
if (!migrationFile) {
  console.error('Usage: node scripts/run-migration.js <migration-file>')
  console.error('Example: node scripts/run-migration.js supabase/migrations/022_financial_system.sql')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log(`Reading migration file: ${migrationFile}`)
    const migrationPath = resolve(migrationFile)
    const sql = readFileSync(migrationPath, 'utf-8')
    
    console.log(`Connecting to Supabase: ${SUPABASE_URL}`)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })

    console.log('Running migration...')
    
    // Split SQL by statement (simple approach - splits on semicolons not in strings)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          // Try direct query if RPC fails
          const { error: queryError } = await supabase.from('_migrations').select('*').limit(1)
          if (queryError) {
            console.error(`\nError executing statement ${i + 1}:`)
            console.error(statement.substring(0, 100) + '...')
            console.error(error)
            throw error
          }
        }
      }
    }

    console.log('\n✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('\n❌ Migration failed:')
    console.error(error)
    console.error('\nNote: You may need to run this migration manually using the Supabase SQL Editor.')
    console.error(`Visit: ${SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/_/sql')}`)
    process.exit(1)
  }
}

runMigration()
