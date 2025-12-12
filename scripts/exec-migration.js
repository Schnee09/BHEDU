#!/usr/bin/env node

/**
 * Supabase Migration Executor
 * Runs a specific migration file against your Supabase database
 * 
 * Usage: node scripts/exec-migration.js <migration-file>
 * Example: node scripts/exec-migration.js 20241209_add_staff_role.sql
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Try web/.env.local if root doesn't have it
if (!process.env.SUPABASE_URL) {
  require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const migrationArg = process.argv[2];
  
  if (!migrationArg) {
    console.log('📋 Available migrations:');
    const migrationsDir = path.join(__dirname, '../supabase/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    files.forEach(f => console.log(`   • ${f}`));
    console.log('\nUsage: node scripts/exec-migration.js <migration-file>');
    console.log('Example: node scripts/exec-migration.js 20241209_add_staff_role.sql');
    return;
  }

  // Find the migration file
  let migrationPath;
  if (fs.existsSync(migrationArg)) {
    migrationPath = migrationArg;
  } else {
    migrationPath = path.join(__dirname, '../supabase/migrations', migrationArg);
  }

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationArg}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  console.log(`\n📄 Migration: ${path.basename(migrationPath)}`);
  console.log(`📊 SQL size: ${(sql.length / 1024).toFixed(2)} KB`);
  console.log(`🔗 Supabase URL: ${SUPABASE_URL || 'Not configured'}`);
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('\n⚠️  Environment variables not found.');
    console.log('\n📝 To run this migration manually:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Create a new query');
    console.log('   3. Paste the SQL below and click Run\n');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
    return;
  }

  // Try to run using Supabase REST API
  console.log('\n⏳ Executing migration...\n');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });

    // Split SQL into individual statements
    const statements = sql
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';
      
      try {
        // Try using rpc if available
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: stmt + ';' 
        });
        
        if (error) {
          throw error;
        }
        console.log(`   ✅ ${i + 1}/${statements.length}: ${preview}`);
        success++;
      } catch (err) {
        console.log(`   ⚠️  ${i + 1}/${statements.length}: ${preview}`);
        console.log(`       Error: ${err.message || err}`);
        failed++;
      }
    }

    console.log(`\n📊 Results: ${success} succeeded, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\n💡 Some statements failed. Run manually in SQL Editor:');
      console.log(`   ${SUPABASE_URL.replace('.supabase.co', '.supabase.co/project/_/sql')}`);
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📝 Run manually in Supabase SQL Editor:');
    console.log('='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
  }
}

main().catch(console.error);
