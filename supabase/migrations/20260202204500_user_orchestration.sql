-- Migration: User Orchestration & Enhanced Provisioning
-- Created: 2026-02-02
-- Purpose: Support dual-identity (personal_email) and automate role-specific profile creation

-- ============================================
-- PHASE 1: SCHEMA UPDATES
-- ============================================

-- Add personal_email column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'personal_email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN personal_email TEXT;
    RAISE NOTICE 'Added column: personal_email to profiles';
  END IF;
END $$;

-- Add index for search/notifications
CREATE INDEX IF NOT EXISTS idx_profiles_personal_email ON public.profiles(personal_email);

-- ============================================
-- PHASE 2: ENHANCED PROVISIONING TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS trigger AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_profile_id UUID;
BEGIN
    -- 1. Extract metadata
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    -- 2. Insert into profiles and get the id
    -- Note: We use the existing trigger pattern but enhance it
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name, 
        role, 
        phone,
        personal_email,
        account_status,
        is_active
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_full_name,
        v_role,
        NEW.phone,
        NEW.raw_user_meta_data->>'personal_email',
        'active',
        TRUE
    )
    RETURNING id INTO v_profile_id;

    -- 3. Provision Role-Specific Profiles
    IF v_role = 'student' THEN
        INSERT INTO public.student_profiles (profile_id, student_code, grade_level)
        VALUES (
            v_profile_id, 
            NEW.raw_user_meta_data->>'student_code',
            NEW.raw_user_meta_data->>'grade_level'
        )
        ON CONFLICT (profile_id) DO NOTHING;
    ELSIF v_role IN ('teacher', 'tutor') THEN
        INSERT INTO public.teacher_profiles (
            profile_id, 
            teacher_type, 
            department,
            specialization,
            hourly_rate
        )
        VALUES (
            v_profile_id, 
            COALESCE(NEW.raw_user_meta_data->>'teacher_type', 'full_time'),
            NEW.raw_user_meta_data->>'department',
            NEW.raw_user_meta_data->>'specialization',
            (NEW.raw_user_meta_data->>'hourly_rate')::DECIMAL
        )
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    -- 4. Handle Invitation Redemption
    IF NEW.raw_user_meta_data->>'invite_token' IS NOT NULL THEN
        UPDATE public.user_invitations
        SET used_at = NOW(),
            used_by = v_profile_id
        WHERE token = NEW.raw_user_meta_data->>'invite_token'
          AND used_at IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_v2();

-- ============================================
-- DONE
-- ============================================
SELECT 'User orchestration migration complete!' AS status;
