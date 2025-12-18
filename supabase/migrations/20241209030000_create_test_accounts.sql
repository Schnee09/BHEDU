-- =====================================================
-- CREATE TEST ACCOUNTS FOR ALL 4 ROLES
-- Password: test123 for all accounts
-- Wait a moment for triggers, then create profiles
-- (Some Supabase setups auto-create profiles via trigger)

DO $$
BEGIN
  -- Only run profile creation if the profiles table exists in this environment
  IF to_regclass('public.profiles') IS NOT NULL THEN

    -- Insert profile for admin
    INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
    SELECT 
      gen_random_uuid(),
      u.id,
      'admin@test.com',
      'Test Admin',
      'admin',
      now(),
      now()
    FROM auth.users u
    WHERE u.email = 'admin@test.com'
      AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@test.com');

    -- Insert profile for staff
    INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
    SELECT
      gen_random_uuid(),
      u.id,
      'staff@test.com',
      'Test Staff',
      'staff',
      now(),
      now()
    FROM auth.users u
    WHERE u.email = 'staff@test.com'
      AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'staff@test.com');

    -- Insert profile for teacher
    INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
    SELECT
      gen_random_uuid(),
      u.id,
      'teacher@test.com',
      'Test Teacher',
      'teacher',
      now(),
      now()
    FROM auth.users u
    WHERE u.email = 'teacher@test.com'
      AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'teacher@test.com');

    -- Insert profile for student
    INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
    SELECT
      gen_random_uuid(),
      u.id,
      'student@test.com',
      'Test Student',
      'student',
      now(),
      now()
    FROM auth.users u
    WHERE u.email = 'student@test.com'
      AND NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student@test.com');

  END IF;
END
$$;
;

-- =====================================================
-- VERIFY TEST ACCOUNTS
-- =====================================================
-- NOTE: Verification queries are omitted during db pull as they may rely on runtime data.
-- You can run the SELECT below manually in your environment after creating test accounts:
-- SELECT p.full_name, p.email, p.role, CASE WHEN u.id IS NOT NULL THEN '✅ Has Auth' ELSE '❌ No Auth' END as auth_status
-- FROM profiles p LEFT JOIN auth.users u ON p.user_id = u.id WHERE p.email LIKE '%@test.com' ORDER BY p.role;
