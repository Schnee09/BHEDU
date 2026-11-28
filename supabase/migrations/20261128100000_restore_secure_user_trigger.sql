-- Ensure every Auth user runs through the secured profile provisioning function.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_v2();

-- Supabase Auth performs user inserts as this internal database role.
GRANT EXECUTE ON FUNCTION public.handle_new_user_v2() TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_v2() FROM PUBLIC;
