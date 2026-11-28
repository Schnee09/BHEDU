-- Turn an optional student code supplied during parent signup into a pending
-- link request. The link remains inaccessible until staff approval.

CREATE OR REPLACE FUNCTION public.create_parent_link_from_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_student_code TEXT;
    v_student_id UUID;
BEGIN
    IF NEW.role <> 'parent' THEN
        RETURN NEW;
    END IF;

    SELECT NULLIF(trim(auth_user.raw_user_meta_data->>'child_student_code'), '')
    INTO v_student_code
    FROM auth.users AS auth_user
    WHERE auth_user.id = NEW.user_id;

    IF v_student_code IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT student.id
    INTO v_student_id
    FROM public.profiles AS student
    LEFT JOIN public.student_profiles AS student_detail
      ON student_detail.profile_id = student.id
    WHERE student.role = 'student'
      AND student.is_active = TRUE
      AND upper(COALESCE(NULLIF(student.student_code, ''), student_detail.student_code))
          = upper(v_student_code)
    LIMIT 1;

    IF v_student_id IS NULL THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.parent_student_links (
        parent_id,
        student_id,
        relationship,
        status,
        notes
    )
    VALUES (
        NEW.id,
        v_student_id,
        'parent',
        'pending',
        'Yêu cầu được tạo từ mã học sinh khi đăng ký tài khoản phụ huynh.'
    )
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_parent_profile_created_request_link ON public.profiles;

CREATE TRIGGER on_parent_profile_created_request_link
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.create_parent_link_from_signup();

GRANT EXECUTE ON FUNCTION public.create_parent_link_from_signup() TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.create_parent_link_from_signup() FROM PUBLIC;
