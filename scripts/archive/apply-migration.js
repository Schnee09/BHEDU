require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Extract project ref from URL
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
  
  console.log('🔧 Applying Financial System Migration via SQL Editor API\n');
  console.log(`Project: ${projectRef}`);
  console.log(`URL: ${SUPABASE_URL}\n`);
  
  // Read the migration file
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '010_financial_system.sql');
  
  if (!fs.existsSync(migrationPath)) {
    console.log('❌ Migration file not found:', migrationPath);
    return;
  }
  
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log(`📄 Loaded migration: ${migrationPath}`);
  console.log(`   Size: ${migrationSQL.length} bytes\n`);
  
  // Split into statements and execute one by one
  // Remove comments and split by semicolons
  const statements = migrationSQL
    .split(/;[\r\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📋 Found ${statements.length} SQL statements\n`);
  console.log('🚀 Executing migration...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: stmt })
      });
      
      if (response.ok) {
        console.log(`✅ ${i + 1}/${statements.length}: ${preview}...`);
        successCount++;
      } else {
        const error = await response.text();
        // Check if it's just a "function not found" error (expected)
        if (error.includes('exec_sql')) {
          // Can't use RPC, need to try different approach
          console.log(`⚠️  RPC not available, switching to direct SQL execution...`);
          break;
        }
        console.log(`❌ ${i + 1}/${statements.length}: ${preview}...`);
        console.log(`   Error: ${error.substring(0, 100)}`);
        errorCount++;
      }
    } catch (err) {
      console.log(`❌ ${i + 1}/${statements.length}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Results: ${successCount} success, ${errorCount} errors`);
  
  if (errorCount > 0 || successCount === 0) {
    console.log('\n⚠️  Could not execute via API. Please run the migration manually:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy and paste the contents of:');
    console.log(`   ${migrationPath}`);
    console.log('3. Click "Run" to execute');
    console.log('4. Then run: node scripts/seed-financial-data.js');
  }
}

applyMigration();
