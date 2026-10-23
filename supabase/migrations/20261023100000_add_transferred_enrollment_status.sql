-- Keep this enum change in its own migration. PostgreSQL requires a commit
-- before a newly added enum value can be used by functions in a later migration.
ALTER TYPE public.enrollment_status ADD VALUE IF NOT EXISTS 'transferred';
