#!/usr/bin/env node

/**
 * Direct Supabase SQL Executor
 * Directly connects to Supabase and executes raw SQL
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

async function executeSql() {
  try {
    console.log('🚀 Applying Financial System Migration...\n');
    
    const migrationPath = path.join(__dirname, 'migrations', '010_financial_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log(`📂 Reading: ${migrationPath}`);
    console.log(`📝 SQL size: ${(sql.length / 1024).toFixed(2)} KB`);
    console.log('\n⏳ Executing migration...\n');
    
    // Try to execute the raw SQL directly
    try {
      const { data, error } = await supabase.rpc('exec', { 
        sql: sql 
      });
      
      if (error) {
        throw error;
      }
      
      console.log('✅ Migration executed successfully!');
      console.log('\n📋 Next steps:');
      console.log('   1. Run: npm run check-tables');
      console.log('   2. Verify all 10 tables show ✅');
      console.log('   3. Visit: http://localhost:3000/dashboard/admin/data-dump');
    } catch (rpcError) {
      // If exec() doesn't exist, suggest SQL Editor
      throw rpcError;
    }
    
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    console.error('\n💡 Try using the SQL Editor instead:');
    console.error('   1. Open: https://app.supabase.com');
    console.error('   2. Go to: SQL Editor → New Query');
    console.error('   3. Copy: supabase/migrations/010_financial_system.sql');
    console.error('   4. Paste and click: Run');
    process.exit(1);
  }
}

async function executeRaw(sql) {
  // This is a fallback - for now just indicate what to do
  console.error('⚠️  Cannot execute directly via this method.');
  console.error('\n💡 Please use the SQL Editor method:');
  console.error('   1. Open: https://app.supabase.com');
  console.error('   2. Click: SQL Editor → New Query');
  console.error('   3. Paste file: supabase/migrations/010_financial_system.sql');
  console.error('   4. Click: Run');
  process.exit(1);
}

executeSql();
