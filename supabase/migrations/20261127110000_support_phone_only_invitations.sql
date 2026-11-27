-- The invitation UI and verification flow support either email or phone.
-- Keep at least one contact method while allowing phone-only invitations.

ALTER TABLE public.user_invitations
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.user_invitations
  DROP CONSTRAINT IF EXISTS user_invitations_contact_check;

ALTER TABLE public.user_invitations
  ADD CONSTRAINT user_invitations_contact_check
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

COMMENT ON COLUMN public.user_invitations.email IS
  'Optional invitation email; either email or phone must be present.';
