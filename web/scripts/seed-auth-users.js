// Usage: node web/scripts/seed-auth-users.js
// Requires: @supabase/supabase-js (already in package.json)

const { createClient } = require('@supabase/supabase-js');
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

// Load from environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    email: 'admin@bhedu.com',
    password: 'admin123',
    profileId: '00000000-0000-0000-0000-000000000001',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'teacher@example.com',
    password: 'teacher123',
    profileId: '00000000-0000-0000-0000-000000000002',
    role: 'teacher',
    firstName: 'Teacher',
    lastName: 'Smith',
  },
  {
    email: 'charlie@student.com',
    password: 'student123',
    profileId: '00000000-0000-0000-0000-000000000003',
    role: 'student',
    firstName: 'Charlie',
    lastName: 'Student',
  },
  {
    email: 'dana@student.com',
    password: 'student123',
    profileId: '00000000-0000-0000-0000-000000000004',
    role: 'student',
    firstName: 'Dana',
    lastName: 'Student',
  },
];

async function createAndLinkUser({ email, password, profileId, role, firstName, lastName }) {
  try {
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', profileId)
      .single();

    if (existingProfile && existingProfile.user_id) {
      console.log(`⚠️  Profile ${profileId} already linked to user_id: ${existingProfile.user_id}`);
      return;
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role,
      },
    });

    if (error) {
      // Check if user already exists
      if (error.message.includes('already registered')) {
        console.log(`⚠️  User ${email} already exists in auth`);
        // Try to fetch existing user and link
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users?.users?.find(u => u.email === email);
        if (existingUser && !existingProfile?.user_id) {
          // Link to profile
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: profileId,
              user_id: existingUser.id,
              email,
              first_name: firstName,
              last_name: lastName,
              role,
            }, { onConflict: 'id' });
          
          if (updateError) {
            console.error(`❌ Error updating profile for ${email}:`, updateError.message);
          } else {
            console.log(`✅ Linked existing user: ${email} (profile ${profileId})`);
          }
        }
        return;
      }
      console.error(`❌ Error creating user ${email}:`, error.message);
      return;
    }

    const userId = data.user.id;

    // Create or update profile and link to auth user
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: profileId,
        user_id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error(`❌ Error upserting profile for ${email}:`, upsertError.message);
      return;
    }

    console.log(`✅ Created user: ${email} (${role}) → profile ${profileId}`);
  } catch (err) {
    console.error(`❌ Unexpected error for ${email}:`, err.message);
  }
}

async function main() {
  console.log('🔐 Seeding test auth users...\n');

  for (const user of testUsers) {
    await createAndLinkUser(user);
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📝 Test credentials:');
  console.log('   Admin: admin@bhedu.com / admin123');
  console.log('   Teacher: teacher@example.com / teacher123');
  console.log('   Students: charlie@student.com, dana@student.com / student123');
}

main();
