/**
 * Database Cleanup Script
 * Fixes profile issues:
 * 1. Remove orphan profiles (user_id = null)
 * 2. Remove duplicate profiles (keep the one with user_id)
 * 3. Verify all test accounts are properly linked
 */

require('dotenv').config({ path: 'web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function cleanup() {
  console.log('\n🧹 DATABASE CLEANUP\n');
  console.log('='.repeat(50));

  // Step 1: Find orphan profiles (user_id = null)
  console.log('\n1️⃣ Finding orphan profiles (user_id = null)...');
  const { data: orphans, error: orphanError } = await supabase
    .from('profiles')
    .select('id, email, role, user_id')
    .is('user_id', null);

  if (orphanError) {
    console.error('Error finding orphans:', orphanError.message);
  } else {
    console.log(`   Found ${orphans?.length || 0} orphan profiles`);
    if (orphans?.length > 0) {
      console.log('   Orphans:');
      orphans.forEach(p => console.log(`     - ${p.email} (${p.role})`));
    }
  }

  // Step 2: Find duplicate emails
  console.log('\n2️⃣ Finding duplicate email profiles...');
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, role, user_id')
    .order('email');

  const emailCounts = {};
  for (const p of allProfiles || []) {
    if (!emailCounts[p.email]) emailCounts[p.email] = [];
    emailCounts[p.email].push(p);
  }

  const duplicates = Object.entries(emailCounts).filter(([, arr]) => arr.length > 1);
  console.log(`   Found ${duplicates.length} emails with duplicates`);
  
  for (const [email, profiles] of duplicates) {
    console.log(`\n   📧 ${email}:`);
    for (const p of profiles) {
      const hasUserId = p.user_id ? '✅ has user_id' : '❌ NO user_id';
      console.log(`     - ${p.id} (${p.role}) ${hasUserId}`);
    }
  }

  // Step 3: Clean up - delete orphans and duplicates
  console.log('\n3️⃣ Cleaning up...');
  
  let deletedCount = 0;

  // Delete orphan profiles
  if (orphans?.length > 0) {
    for (const orphan of orphans) {
      // Check if there's a valid profile with same email
      const { data: valid } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', orphan.email)
        .not('user_id', 'is', null)
        .limit(1);

      if (valid?.length > 0) {
        // Safe to delete the orphan
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', orphan.id);
        
        if (!error) {
          console.log(`   ✅ Deleted orphan: ${orphan.email}`);
          deletedCount++;
        } else {
          console.log(`   ❌ Failed to delete ${orphan.email}: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️ Keeping orphan (no valid profile): ${orphan.email}`);
      }
    }
  }

  // Step 4: Verify test accounts
  console.log('\n4️⃣ Verifying test accounts...');
  const testEmails = ['admin@test.com', 'staff@test.com', 'teacher@test.com', 'student@test.com'];
  
  for (const email of testEmails) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, role, user_id')
      .eq('email', email);

    if (error) {
      console.log(`   ❌ ${email}: Error - ${error.message}`);
    } else if (!profiles || profiles.length === 0) {
      console.log(`   ❌ ${email}: NOT FOUND`);
    } else if (profiles.length > 1) {
      console.log(`   ⚠️ ${email}: DUPLICATE (${profiles.length} profiles)`);
    } else {
      const p = profiles[0];
      const status = p.user_id ? '✅' : '❌ NO user_id';
      console.log(`   ${status} ${email} (${p.role})`);
    }
  }

  // Step 5: Summary
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 SUMMARY');
  console.log(`   Profiles deleted: ${deletedCount}`);
  
  // Final count
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  console.log(`   Total profiles remaining: ${count}`);

  console.log('\n✅ Cleanup complete!\n');
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
