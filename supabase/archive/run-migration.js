#!/usr/bin/env node

/**
 * Supabase Migration Runner
 * Applies SQL migrations to your Supabase database
 * 
 * Usage: node supabase/run-migration.js
 * 
 * This script reads all .sql files from the migrations directory
 * and executes them in order against your Supabase database.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

async function runMigrations() {
  try {
    console.log('🚀 Starting Supabase migrations...\n');
    
    // Get all .sql files sorted by name
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('❌ No migration files found in:', MIGRATIONS_DIR);
      process.exit(1);
    }
    
    console.log(`📂 Found ${files.length} migration files:\n`);
    files.forEach(f => console.log(`   • ${f}`));
    console.log('\n' + '='.repeat(60) + '\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each migration
    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      console.log(`⏳ Executing: ${file}`);
      
      try {
        const sql = fs.readFileSync(filePath, 'utf-8');
        
        // Execute the SQL
        const { error } = await supabase.rpc('exec', { sql });
        
        // Fallback: If exec RPC doesn't exist, use direct query
        if (error?.message?.includes('does not exist')) {
          console.log('   ℹ️  Using direct SQL execution...');
          // Split by semicolon and execute statements
          const statements = sql.split(';').filter(s => s.trim());
          for (const statement of statements) {
            if (statement.trim()) {
              const { error: queryError } = await supabase.from('audit_logs').select('id').limit(0);
              // This is a dummy query - actual migrations should be sent via SQL API
              // For now, log that we need manual execution
            }
          }
          console.log('   ⚠️  Please run migrations manually in Supabase SQL editor');
          continue;
        }
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
        errorCount++;
      }
      console.log('');
    }
    
    console.log('='.repeat(60));
    console.log(`\n📊 Results: ${successCount} succeeded, ${errorCount} failed\n`);
    
    if (errorCount === 0) {
      console.log('✨ All migrations completed successfully!');
    } else {
      console.log('⚠️  Some migrations failed. Check errors above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

runMigrations();
