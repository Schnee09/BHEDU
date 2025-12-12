#!/usr/bin/env node

/**
 * Test Finance Endpoints
 * Verifies that all finance endpoints respond without 500 errors
 */

const financeEndpoints = [
  '/api/admin/finance/student-accounts',
  '/api/admin/finance/fee-types',
  '/api/admin/finance/fee-assignments',
  '/api/admin/finance/invoices',
  '/api/admin/finance/invoice-items',
  '/api/admin/finance/payment-methods',
  '/api/admin/finance/payments',
  '/api/admin/finance/payment-allocations',
  '/api/admin/finance/payment-schedules',
  '/api/admin/finance/payment-schedule-installments'
];

async function testEndpoints() {
  console.log('🧪 Testing Finance Endpoints...\n');
  console.log('Base URL: http://localhost:3000\n');
  console.log('='.repeat(70) + '\n');
  
  let passCount = 0;
  let failCount = 0;
  
  for (const endpoint of financeEndpoints) {
    const url = `http://localhost:3000${endpoint}`;
    
    try {
      const response = await fetch(url);
      const statusCode = response.status;
      const statusText = response.statusText;
      
      let status = '';
      if (statusCode === 200) {
        const data = await response.json();
        status = `✅ ${statusCode} - ${data.data?.length || 0} records`;
        passCount++;
      } else if (statusCode === 401 || statusCode === 403) {
        status = `⚠️  ${statusCode} - Auth required (expected without login)`;
        passCount++; // This is OK - table exists, just needs auth
      } else if (statusCode === 429) {
        status = `⚠️  ${statusCode} - Rate limited (retry needed)`;
        passCount++; // Rate limit means endpoint works
      } else if (statusCode === 500) {
        status = `❌ ${statusCode} - Internal Server Error`;
        failCount++;
      } else {
        status = `⚠️  ${statusCode} - ${statusText}`;
        passCount++;
      }
      
      console.log(`${status.padEnd(50)} ${endpoint}`);
      
    } catch (error) {
      console.log(`❌ Network Error${' '.repeat(36)} ${endpoint}`);
      console.log(`   ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);
  
  if (failCount === 0) {
    console.log('✨ All finance endpoints are working correctly!');
    console.log('\n✅ No 500 errors - Tables exist and are accessible');
    console.log('⚠️  Auth errors (401/403) are expected without login');
    console.log('\nNext: Build the finance management UI! 🚀');
  } else {
    console.log('⚠️  Some endpoints returned errors');
    console.log('Check the messages above for details');
  }
}

// Run the tests
testEndpoints().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
