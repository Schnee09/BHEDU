-- Make custom roles first-class database records and allow profiles to use them.
-- These records are managed only through guarded server routes using service_role.

CREATE TABLE IF NOT EXISTS public.custom_roles (
  code TEXT PRIMARY KEY
    CHECK (code ~ '^[a-z][a-z0-9_-]{0,49}$'),
  name TEXT NOT NULL
    CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
  description TEXT NOT NULL DEFAULT ''
    CHECK (char_length(btrim(description)) <= 500),
  color TEXT NOT NULL DEFAULT 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    CHECK (char_length(btrim(color)) BETWEEN 1 AND 300),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.custom_roles TO service_role;

DROP TRIGGER IF EXISTS custom_roles_updated_at ON public.custom_roles;
CREATE TRIGGER custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NULL OR role ~ '^[a-z][a-z0-9_-]{0,49}$');

COMMENT ON TABLE public.custom_roles IS
  'Center-defined roles. Direct client access is denied; guarded server routes use service_role.';
COMMENT ON COLUMN public.profiles.role IS
  'System or custom role code using the canonical lowercase role-code format.';
