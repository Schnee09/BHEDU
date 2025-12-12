#!/usr/bin/env node

/**
 * Supabase Financial Tables Diagnostic
 * Checks which financial tables exist in your Supabase database
 * 
 * Usage: npm run check-tables
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }
  }
);

// Tables that should exist
const REQUIRED_TABLES = [
  'student_accounts',
  'fee_types',
  'fee_assignments',
  'invoices',
  'invoice_items',
  'payment_methods',
  'payments',
  'payment_allocations',
  'payment_schedules',
  'payment_schedule_installments'
];

async function checkTables() {
  console.log('\n📊 Checking Supabase Financial Tables\n');
  console.log('='.repeat(60));
  
  try {
    // Try a simple query to each table
    const results = {};
    let allExist = true;
    
    for (const table of REQUIRED_TABLES) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            results[table] = { exists: false, error: 'Table does not exist' };
            allExist = false;
          } else {
            results[table] = { exists: false, error: error.message };
            allExist = false;
          }
        } else {
          results[table] = { exists: true, records: count || 0 };
        }
      } catch (err) {
        results[table] = { exists: false, error: err.message };
        allExist = false;
      }
    }
    
    // Display results
    console.log('\n📋 Table Status:\n');
    
    for (const [table, status] of Object.entries(results)) {
      const icon = status.exists ? '✅' : '❌';
      const info = status.exists ? `${status.records} records` : status.error;
      console.log(`  ${icon} ${table.padEnd(35)} ${info}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (allExist) {
      console.log('\n✨ All financial tables exist! Ready to use.\n');
      console.log('Next: Visit http://localhost:3000/dashboard/admin/data-dump');
      console.log('      to test the endpoints\n');
      return true;
    } else {
      console.log('\n⚠️  Some tables are missing!\n');
      console.log('Fix: Follow the migration guide:');
      console.log('     1. Open APPLY_MIGRATION_NOW.md');
      console.log('     2. Or read FINANCIAL_MIGRATION_GUIDE.md\n');
      console.log('Then run this command again to verify.\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Error checking tables:', error.message);
    console.error('\nMake sure:');
    console.error('  • SUPABASE_URL is set in .env.local');
    console.error('  • SUPABASE_SERVICE_ROLE_KEY is set in .env.local');
    console.error('  • You have internet connection to Supabase\n');
    return false;
  }
}

// Run the check
checkTables().then(success => {
  process.exit(success ? 0 : 1);
});
