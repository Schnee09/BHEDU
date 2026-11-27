-- Invitations may target either a system role or a center-defined custom role.
-- The guarded invitation API verifies that custom role records exist and that
-- the inviter may delegate every permission included in the selected role.

ALTER TABLE public.user_invitations
  DROP CONSTRAINT IF EXISTS user_invitations_role_check;

ALTER TABLE public.user_invitations
  ADD CONSTRAINT user_invitations_role_check
  CHECK (role ~ '^[a-z][a-z0-9_-]{0,49}$');

COMMENT ON COLUMN public.user_invitations.role IS
  'System or custom role code validated by the guarded invitation API.';
