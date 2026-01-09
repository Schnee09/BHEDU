const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
  try {
    console.log('Checking profiles table...');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(100); // Increase limit to see all profiles

    if (error) {
      console.error('Error fetching profiles:', error);
    } else {
      console.log('Profiles found:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('First 3 profiles:');
        data.slice(0, 3).forEach((profile, index) => {
          console.log(`${index + 1}. ${profile.email} (${profile.role}) - user_id: ${profile.user_id}`);
        });
      }
    }

    // Also check auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
    } else {
      console.log('Auth users found:', authData?.users?.length || 0);
      if (authData?.users && authData.users.length > 0) {
        console.log('First 3 auth users:');
        authData.users.slice(0, 3).forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} - id: ${user.id}`);
        });
      }
    }

    // Check for mismatch
    if (data && authData?.users) {
      console.log(`\nDetailed analysis:`);
      console.log(`Total profiles in DB: ${data.length}`);
      console.log(`Total auth users: ${authData.users.length}`);

      const profileUserIds = new Set(data.map(p => p.user_id));
      const authUserIds = new Set(authData.users.map(u => u.id));

      console.log(`\nProfile user_ids in set: ${profileUserIds.size}`);
      console.log(`Auth user ids in set: ${authUserIds.size}`);

      const profilesWithoutAuth = data.filter(p => !authUserIds.has(p.user_id));
      const authWithoutProfiles = authData.users.filter(u => !profileUserIds.has(u.id));

      console.log(`\n- Profiles without matching auth users: ${profilesWithoutAuth.length}`);
      console.log(`- Auth users without profiles: ${authWithoutProfiles.length}`);

      if (authWithoutProfiles.length > 0) {
        console.log('\nFirst 5 auth users missing profiles:');
        authWithoutProfiles.slice(0, 5).forEach(user => {
          console.log(`  - ${user.email} (${user.id})`);
        });
      }

      // Let's also check if there are profiles with null user_id
      const profilesWithNullUserId = data.filter(p => !p.user_id);
      console.log(`\nProfiles with null user_id: ${profilesWithNullUserId.length}`);
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkProfiles();