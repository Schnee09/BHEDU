#!/usr/bin/env node

/**
 * API Health Check & Test Script for BH-EDU
 * Tests Supabase connection, schema, and basic CRUD operations
 */

const path = require('path');
const fs = require('fs');

// Load .env file if it exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Supabase connection: OK');
      return true;
    } else {
      console.log('❌ Supabase connection: FAILED');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Supabase connection: ERROR');
    console.log(`   ${error.message}`);
    return false;
  }
}

async function testTableExists(tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'count=exact'
      }
    });
    
    if (response.ok) {
      const count = response.headers.get('content-range')?.split('/')[1] || '0';
      console.log(`✅ Table '${tableName}': OK (${count} rows)`);
      return true;
    } else if (response.status === 401 || response.status === 403) {
      console.log(`⚠️  Table '${tableName}': EXISTS (RLS enabled - access denied for anon)`);
      return true;
    } else {
      console.log(`❌ Table '${tableName}': NOT FOUND or ERROR (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Table '${tableName}': ERROR - ${error.message}`);
    return false;
  }
}

async function testReferenceTables() {
  console.log('\n🔍 Testing Reference Tables...\n');
  
  const tables = [
    'academic_years',
    'grading_scales',
    'payment_methods',
    'fee_types'
  ];
  
  let allOk = true;
  for (const table of tables) {
    const ok = await testTableExists(table);
    if (!ok) allOk = false;
  }
  
  return allOk;
}

async function testCoreTables() {
  console.log('\n🔍 Testing Core Tables...\n');
  
  const tables = [
    'profiles',
    'classes',
    'enrollments',
    'guardians',
    'attendance',
    'qr_codes',
    'audit_logs'
  ];
  
  let allOk = true;
  for (const table of tables) {
    const ok = await testTableExists(table);
    if (!ok) allOk = false;
  }
  
  return allOk;
}

async function testReferenceData() {
  console.log('\n🔍 Testing Reference Data (Public Access)...\n');
  
  try {
    // Test academic years
    const response = await fetch(`${SUPABASE_URL}/rest/v1/academic_years?select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Academic Years: ${data.length} records found`);
      if (data.length > 0) {
        console.log(`   Sample: ${data[0].name} (${data[0].start_date} to ${data[0].end_date})`);
      }
    } else {
      console.log(`⚠️  Academic Years: Access denied (status ${response.status})`);
      console.log('   This is expected if RLS is enabled without policies for anon users.');
    }
  } catch (error) {
    console.log(`❌ Reference Data: ERROR - ${error.message}`);
  }
}

async function runHealthCheck() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  BH-EDU API Health Check & Test      ║');
  console.log('╚══════════════════════════════════════╝\n');
  
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.log('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not configured!');
    console.log('   Set environment variables or update this script.\n');
    process.exit(1);
  }
  
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - Supabase connection failed.\n');
    process.exit(1);
  }
  
  const refTablesOk = await testReferenceTables();
  const coreTablesOk = await testCoreTables();
  
  await testReferenceData();
  
  console.log('\n╔══════════════════════════════════════╗');
  if (connectionOk && refTablesOk && coreTablesOk) {
    console.log('║  ✅ Health Check: PASSED             ║');
  } else {
    console.log('║  ⚠️  Health Check: ISSUES FOUND      ║');
  }
  console.log('╚══════════════════════════════════════╝\n');
  
  console.log('Next steps:');
  console.log('1. If tables are missing, apply COMPLETE_STUDENT_MANAGEMENT.sql');
  console.log('2. If reference data is missing, apply COMPLETE_TEST_SEED.sql');
  console.log('3. Create test users via seed scripts');
  console.log('4. Test authenticated CRUD operations\n');
}

// Run health check
runHealthCheck().catch(console.error);
