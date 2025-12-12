#!/usr/bin/env node

/**
 * Seed Test Users for All 4 Roles
 * Creates auth users and profiles directly via Supabase Admin API
 * 
 * Usage: node scripts/seed-test-users.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_USERS = [
  { email: 'admin@test.com', password: 'test123', role: 'admin', full_name: 'Test Admin' },
  { email: 'staff@test.com', password: 'test123', role: 'staff', full_name: 'Test Staff' },
  { email: 'teacher@test.com', password: 'test123', role: 'teacher', full_name: 'Test Teacher' },
  { email: 'student@test.com', password: 'test123', role: 'student', full_name: 'Test Student' },
];

async function createTestUser(user) {
  console.log(`\n📧 Creating ${user.role}: ${user.email}`);

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === user.email);

  let authUser;

  if (existingUser) {
    console.log(`   ⚠️  Auth user exists, using existing: ${existingUser.id}`);
    authUser = existingUser;
  } else {
    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name }
    });

    if (error) {
      console.error(`   ❌ Failed to create auth user: ${error.message}`);
      return false;
    }

    authUser = data.user;
    console.log(`   ✅ Auth user created: ${authUser.id}`);
  }

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (existingProfile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: user.role, 
        full_name: user.full_name,
        email: user.email,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', authUser.id);

    if (updateError) {
      console.error(`   ❌ Failed to update profile: ${updateError.message}`);
      return false;
    }
    console.log(`   ✅ Profile updated with role: ${user.role}`);
  } else {
    // Create new profile
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error(`   ❌ Failed to create profile: ${insertError.message}`);
      return false;
    }
    console.log(`   ✅ Profile created with role: ${user.role}`);
  }

  return true;
}

async function main() {
  console.log('🚀 Seeding Test Users for 4-Role System');
  console.log('========================================');
  console.log(`🔗 Supabase: ${SUPABASE_URL}`);

  let success = 0;
  let failed = 0;

  for (const user of TEST_USERS) {
    const result = await createTestUser(user);
    if (result) success++;
    else failed++;
  }

  console.log('\n========================================');
  console.log(`📊 Results: ${success} created, ${failed} failed`);
  
  // Verify all users
  console.log('\n📋 Verification:');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email, role, full_name')
    .in('email', TEST_USERS.map(u => u.email));

  if (profiles) {
    console.log('\n| Email | Role | Name |');
    console.log('|-------|------|------|');
    profiles.forEach(p => {
      console.log(`| ${p.email} | ${p.role} | ${p.full_name} |`);
    });
  }

  console.log('\n✅ Done! Test accounts ready:');
  console.log('   admin@test.com / test123');
  console.log('   staff@test.com / test123');
  console.log('   teacher@test.com / test123');
  console.log('   student@test.com / test123');
}

main().catch(console.error);
