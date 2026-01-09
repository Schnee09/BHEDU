#!/usr/bin/env node

/**
 * Cleanup Orphan Profiles Script
 * 
 * Finds profiles that don't have corresponding Supabase Auth users
 * and either:
 *   1. Creates auth users for them (sync mode)
 *   2. Deletes them (clean mode)
 * 
 * Usage:
 *   node scripts/cleanup-orphan-profiles.js --mode=list    # Just list orphans
 *   node scripts/cleanup-orphan-profiles.js --mode=sync    # Create auth users for orphans
 *   node scripts/cleanup-orphan-profiles.js --mode=clean   # Delete orphan profiles
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../web/.env.local') });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in web/.env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

// Parse command line args
const args = process.argv.slice(2);
const modeArg = args.find(a => a.startsWith('--mode='));
const mode = modeArg ? modeArg.split('=')[1] : 'list';

const DEFAULT_PASSWORD = 'changeme123';

async function main() {
    console.log('\n🔍 ORPHAN PROFILES CLEANUP\n');
    console.log('='.repeat(50) + '\n');

    try {
        // 1. Get all profiles
        console.log('📋 Fetching all profiles...');
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, user_id, email, full_name, role');

        if (profileError) throw profileError;
        console.log(`   Found ${profiles.length} profiles\n`);

        // 2. Get all auth users
        console.log('🔐 Fetching all auth users...');
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
            perPage: 1000
        });

        if (authError) throw authError;
        const authUsers = authData.users;
        console.log(`   Found ${authUsers.length} auth users\n`);

        // 3. Find orphans (profiles without auth users)
        const authUserIds = new Set(authUsers.map(u => u.id));
        const authUserEmails = new Set(authUsers.map(u => u.email?.toLowerCase()));

        const orphans = profiles.filter(p => {
            // If profile has user_id, check if that user exists
            if (p.user_id) {
                return !authUserIds.has(p.user_id);
            }
            // If no user_id but has email, check if email exists in auth
            if (p.email) {
                return !authUserEmails.has(p.email.toLowerCase());
            }
            // No user_id and no email = orphan
            return true;
        });

        console.log(`🚨 Found ${orphans.length} orphan profiles:\n`);

        if (orphans.length === 0) {
            console.log('   ✅ No orphan profiles found! Database is clean.\n');
            return;
        }

        // Display orphans
        orphans.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.full_name || 'No name'} (${p.email || 'no email'}) - role: ${p.role}`);
        });
        console.log('');

        // Execute based on mode
        if (mode === 'list') {
            console.log('📝 Mode: LIST (no changes made)');
            console.log('   To sync: node scripts/cleanup-orphan-profiles.js --mode=sync');
            console.log('   To clean: node scripts/cleanup-orphan-profiles.js --mode=clean');

        } else if (mode === 'sync') {
            console.log('🔄 Mode: SYNC (creating auth users for orphans)\n');

            let synced = 0;
            let failed = 0;

            for (const orphan of orphans) {
                // Need email to create auth user
                if (!orphan.email) {
                    console.log(`   ⚠️ Skipping ${orphan.full_name || orphan.id}: no email address`);
                    failed++;
                    continue;
                }

                // Check if email already exists in auth (edge case)
                const existingAuth = authUsers.find(u => u.email?.toLowerCase() === orphan.email.toLowerCase());

                if (existingAuth) {
                    // Link existing auth user to profile
                    console.log(`   🔗 Linking ${orphan.email} to existing auth user...`);
                    await supabase
                        .from('profiles')
                        .update({ user_id: existingAuth.id })
                        .eq('id', orphan.id);
                    synced++;

                } else {
                    // Create new auth user
                    console.log(`   ➕ Creating auth user for ${orphan.email}...`);
                    const { data: newAuth, error: createError } = await supabase.auth.admin.createUser({
                        email: orphan.email,
                        password: DEFAULT_PASSWORD,
                        email_confirm: true,
                        user_metadata: { full_name: orphan.full_name, role: orphan.role }
                    });

                    if (createError) {
                        console.log(`      ❌ Failed: ${createError.message}`);
                        failed++;
                    } else {
                        // Update profile with user_id
                        await supabase
                            .from('profiles')
                            .update({ user_id: newAuth.user.id })
                            .eq('id', orphan.id);
                        synced++;
                        console.log(`      ✅ Created (password: ${DEFAULT_PASSWORD})`);
                    }
                }
            }

            console.log(`\n📊 Results: ${synced} synced, ${failed} failed`);
            if (synced > 0) {
                console.log(`\n⚠️ New users have default password: ${DEFAULT_PASSWORD}`);
                console.log('   They should change it on first login.\n');
            }

        } else if (mode === 'clean') {
            console.log('🗑️ Mode: CLEAN (deleting orphan profiles)\n');

            const orphanIds = orphans.map(o => o.id);

            console.log(`   Deleting ${orphanIds.length} orphan profiles...`);
            const { error: deleteError } = await supabase
                .from('profiles')
                .delete()
                .in('id', orphanIds);

            if (deleteError) {
                console.log(`   ❌ Delete failed: ${deleteError.message}`);
            } else {
                console.log(`   ✅ Deleted ${orphanIds.length} orphan profiles`);
            }

        } else {
            console.log(`❌ Unknown mode: ${mode}`);
            console.log('   Valid modes: list, sync, clean');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }

    console.log('\n✨ Done!\n');
}

main();
