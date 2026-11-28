-- Secure account provisioning and invitation redemption.
-- Browser-supplied role metadata is never trusted on its own.

CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_role TEXT;
    v_full_name TEXT;
    v_first_name TEXT;
    v_last_name TEXT;
    v_profile_id UUID;
    v_invite_token TEXT;
    v_invitation public.user_invitations%ROWTYPE;
    v_is_admin_provisioned BOOLEAN;
    v_signup_email TEXT;
    v_signup_phone TEXT;
BEGIN
    v_invite_token := NULLIF(NEW.raw_user_meta_data->>'invite_token', '');
    v_is_admin_provisioned := COALESCE(
        (NEW.raw_app_meta_data->>'provisioned_by_admin')::BOOLEAN,
        FALSE
    );
    v_signup_email := lower(COALESCE(NEW.raw_user_meta_data->>'personal_email', NEW.email, ''));
    v_signup_phone := regexp_replace(
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        '[^0-9]',
        '',
        'g'
    );

    IF v_invite_token IS NOT NULL THEN
        SELECT invitation.*
        INTO v_invitation
        FROM public.user_invitations AS invitation
        WHERE invitation.token = v_invite_token
          AND invitation.used_at IS NULL
          AND invitation.expires_at > NOW()
          AND (
              (
                  invitation.email IS NOT NULL
                  AND lower(invitation.email) = v_signup_email
              )
              OR
              (
                  invitation.phone IS NOT NULL
                  AND length(v_signup_phone) >= 9
                  AND right(regexp_replace(invitation.phone, '[^0-9]', '', 'g'), 9)
                      = right(v_signup_phone, 9)
              )
          )
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invitation is invalid, expired, used, or does not match the account contact';
        END IF;

        v_role := v_invitation.role;
    ELSIF v_is_admin_provisioned THEN
        v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role', ''), 'student');
    ELSE
        -- Public registration currently supports parent accounts only.
        v_role := 'parent';
    END IF;

    v_first_name := NEW.raw_user_meta_data->>'first_name';
    v_last_name := NEW.raw_user_meta_data->>'last_name';
    v_full_name := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        split_part(COALESCE(NEW.email, NEW.phone, 'Người dùng'), '@', 1)
    );

    IF v_first_name IS NULL OR v_last_name IS NULL THEN
        v_first_name := COALESCE(
            v_first_name,
            split_part(v_full_name, ' ', array_length(string_to_array(v_full_name, ' '), 1))
        );
        v_last_name := COALESCE(v_last_name, trim(replace(v_full_name, v_first_name, '')));
    END IF;

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
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        NEW.raw_user_meta_data->>'personal_email',
        'active',
        TRUE
    )
    RETURNING id INTO v_profile_id;

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
            COALESCE(
                NEW.raw_user_meta_data->>'teacher_type',
                CASE WHEN v_role = 'tutor' THEN 'tutor' ELSE 'full_time' END
            ),
            NEW.raw_user_meta_data->>'department',
            NEW.raw_user_meta_data->>'specialization',
            (NEW.raw_user_meta_data->>'hourly_rate')::DECIMAL
        )
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    IF v_invite_token IS NOT NULL THEN
        UPDATE public.user_invitations
        SET used_at = NOW(), used_by = v_profile_id
        WHERE id = v_invitation.id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_v2() FROM PUBLIC;
