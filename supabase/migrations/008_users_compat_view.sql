------------------------------------------------------------
-- 🧩 Compatibility view: public.users -> profiles
-- Purpose: Temporarily satisfy legacy code that queries public.users
-- without changing application code. Maps to profiles.
------------------------------------------------------------

-- Drop existing view if any
DROP VIEW IF EXISTS public.users CASCADE;

-- Create a simple updatable view mapping to profiles
CREATE VIEW public.users AS
SELECT
  p.id,
  p.full_name,
  p.role,
  p.avatar_url,
  p.metadata,
  p.created_at
FROM public.profiles p;

-- Make the view updatable for basic inserts/updates
-- INSERT: allow inserting id, full_name, role, avatar_url, metadata
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

-- UPDATE: map updates to profiles
CREATE OR REPLACE RULE users_update AS
ON UPDATE TO public.users DO INSTEAD
  UPDATE public.profiles SET
    full_name = COALESCE(NEW.full_name, public.profiles.full_name),
    role = COALESCE(NEW.role, public.profiles.role),
    avatar_url = COALESCE(NEW.avatar_url, public.profiles.avatar_url),
    metadata = COALESCE(NEW.metadata, public.profiles.metadata)
  WHERE public.profiles.id = OLD.id;

-- DELETE: map deletes to profiles
CREATE OR REPLACE RULE users_delete AS
ON DELETE TO public.users DO INSTEAD
  DELETE FROM public.profiles WHERE id = OLD.id;

-- Notes:
-- - RLS on profiles still applies to the view
-- - This is a temporary bridge; prefer updating app code to use 'profiles'
------------------------------------------------------------
