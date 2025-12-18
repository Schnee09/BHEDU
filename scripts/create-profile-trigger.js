const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createProfileTrigger() {
  try {
    console.log('Creating profile auto-creation trigger...');

    // Execute the SQL directly using rpc if available, otherwise we'll need to run it manually
    console.log('Please run the following SQL in your Supabase SQL Editor:');
    console.log(`
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that calls the function whenever a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create profiles for existing users who don't have one
INSERT INTO public.profiles (user_id, email, full_name, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'role', 'student')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.user_id
WHERE p.user_id IS NULL;
    `);

    // For now, let's just backfill existing users manually
    console.log('\nAttempting to backfill profiles for existing users...');

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }

    console.log(`Found ${authUsers.users.length} auth users`);

    // Get existing profiles
    const { data: existingProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id');

    if (profileError) {
      console.error('Error fetching existing profiles:', profileError);
      return;
    }

    const existingUserIds = new Set(existingProfiles.map(p => p.user_id));

    // Find users without profiles
    const usersWithoutProfiles = authUsers.users.filter(user => !existingUserIds.has(user.id));

    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);

    // Create profiles for users without them
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutProfiles) {
      try {
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email.split('@')[0],
            role: user.user_metadata?.role || 'student'
          })
          .select();

        if (insertError) {
          console.error(`❌ Error creating profile for ${user.email}:`, insertError);
          errorCount++;
        } else {
          console.log(`✅ Created profile for ${user.email} (ID: ${data?.[0]?.id})`);
          successCount++;
        }
      } catch (catchError) {
        console.error(`💥 Exception creating profile for ${user.email}:`, catchError);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary: ${successCount} profiles created, ${errorCount} errors`);

  } catch (error) {
    console.error('Script error:', error);
  }
}

createProfileTrigger();