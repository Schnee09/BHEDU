-- Migration: Fix User Orchestration Name Handling
-- Created: 2026-02-05
-- Purpose: Ensure first_name and last_name are saved during creation and handle Vietnamese format

-- 1. Update the trigger function to include first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS trigger AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_profile_id UUID;
BEGIN
    -- 1. Extract metadata
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
    v_first_name := NEW.raw_user_meta_data->>'first_name';
    v_last_name := NEW.raw_user_meta_data->>'last_name';
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

    -- If first_name or last_name are missing in metadata, split the full_name
    -- Using the same logic as our JS splitFullName: last word is first_name
    IF v_first_name IS NULL OR v_last_name IS NULL THEN
        -- Simple split for trigger fallback
        v_first_name := COALESCE(v_first_name, split_part(v_full_name, ' ', array_length(string_to_array(v_full_name, ' '), 1)));
        v_last_name := COALESCE(v_last_name, trim(replace(v_full_name, v_first_name, '')));
    END IF;

    -- 2. Insert into profiles and get the id
    INSERT INTO public.profiles (
        user_id, 
        email, 
        full_name, 
        first_name,
        last_name,
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
        v_first_name,
        v_last_name,
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
    ELSIF v_role IN ('teacher', 'tutor', 'staff') THEN
        INSERT INTO public.teacher_profiles (
            profile_id, 
            teacher_type, 
            department,
            specialization,
            hourly_rate
        )
        VALUES (
            v_profile_id, 
            COALESCE(NEW.raw_user_meta_data->>'teacher_type', (CASE WHEN v_role = 'tutor' THEN 'tutor' ELSE 'full_time' END)),
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

-- 2. Backfill existing profiles where first_name/last_name are missing
-- This will fix local UI issues for existing accounts
UPDATE public.profiles
SET 
    first_name = split_part(full_name, ' ', array_length(string_to_array(full_name, ' '), 1)),
    last_name = trim(replace(full_name, split_part(full_name, ' ', array_length(string_to_array(full_name, ' '), 1)), ''))
WHERE (first_name IS NULL OR last_name IS NULL) AND full_name IS NOT NULL;

SELECT 'Trigger fix and backfill complete!' AS status;
