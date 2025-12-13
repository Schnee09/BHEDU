-- Guarded CREATE TEST ACCOUNTS script
-- This migration will only run its test-account inserts when the
-- pgcrypto extension is available (required for gen_random_uuid/crypt/gen_salt)
-- and when run with sufficient privileges. Otherwise it will skip with a NOTICE.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    RAISE NOTICE 'pgcrypto exists — running test-account inserts (guarded)';

    -- Create admin user (id/password generation only if not exists)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    SELECT gen_random_uuid(), 'admin@test.com', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Admin"}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@test.com');

    -- Create staff user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    SELECT gen_random_uuid(), 'staff@test.com', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Staff"}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'staff@test.com');

    -- Create teacher user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    SELECT gen_random_uuid(), 'teacher@test.com', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Teacher"}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher@test.com');

    -- Create student user
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    SELECT gen_random_uuid(), 'student@test.com', crypt('test123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Test Student"}'::jsonb
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'student@test.com');

    -- Create profiles for the test users (only if profiles table exists)
    IF to_regclass('public.profiles') IS NOT NULL THEN
      INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
      SELECT gen_random_uuid(), u.id, u.email, (u.raw_user_meta_data->>'full_name')::text, 
        CASE WHEN u.email = 'admin@test.com' THEN 'admin' WHEN u.email = 'staff@test.com' THEN 'staff' WHEN u.email = 'teacher@test.com' THEN 'teacher' ELSE 'student' END,
        now(), now()
      FROM auth.users u
      WHERE u.email IN ('admin@test.com','staff@test.com','teacher@test.com','student@test.com')
        AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.email = u.email);
    ELSE
      RAISE NOTICE 'profiles table not found — skipping profile inserts';
    END IF;

  ELSE
    RAISE NOTICE 'pgcrypto extension not found — skipping guarded test-account inserts';
  END IF;
END
$$;
