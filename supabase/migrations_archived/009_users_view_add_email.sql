------------------------------------------------------------
-- 🔁 Update compatibility view: add email column
-- Recreate public.users view to include auth.users.email
------------------------------------------------------------

-- Drop rules to allow view recreation
DROP RULE IF EXISTS users_insert ON public.users;
DROP RULE IF EXISTS users_update ON public.users;
DROP RULE IF EXISTS users_delete ON public.users;

-- Drop and recreate the view with email column
DROP VIEW IF EXISTS public.users CASCADE;

CREATE VIEW public.users AS
SELECT
  p.id,
  au.email,           -- from auth.users
  p.full_name,
  p.role,
  p.avatar_url,
  p.metadata,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id;

-- Recreate updatable rules (email is read-only in the view)
CREATE OR REPLACE RULE users_insert AS
ON INSERT TO public.users DO INSTEAD
  INSERT INTO public.profiles (id, full_name, role, avatar_url, metadata)
  VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    NEW.full_name,
    COALESCE(NEW.role, 'student'),
    NEW.avatar_url,
    NEW.metadata
  );

CREATE OR REPLACE RULE users_update AS
ON UPDATE TO public.users DO INSTEAD
  UPDATE public.profiles SET
    full_name = COALESCE(NEW.full_name, public.profiles.full_name),
    role = COALESCE(NEW.role, public.profiles.role),
    avatar_url = COALESCE(NEW.avatar_url, public.profiles.avatar_url),
    metadata = COALESCE(NEW.metadata, public.profiles.metadata)
  WHERE public.profiles.id = OLD.id;

CREATE OR REPLACE RULE users_delete AS
ON DELETE TO public.users DO INSTEAD
  DELETE FROM public.profiles WHERE id = OLD.id;

-- Notes:
-- - Selecting email now works. Email remains read-only via the view.
-- - Access to auth.users for anon users depends on Supabase policies/roles.
--   API routes using service role key will have access.
------------------------------------------------------------
