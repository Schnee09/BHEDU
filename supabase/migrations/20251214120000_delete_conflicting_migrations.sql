-- Remove legacy short-version migration entries that conflict with local filenames.
-- This migration only touches the migration metadata table and is guarded.
DO $$
BEGIN
  IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL THEN
    DELETE FROM supabase_migrations.schema_migrations
    WHERE version IN ('20241209','999');
  END IF;
END$$;

-- Verify: select removed rows (harmless in migration run; logged as NOTICE by PG if run interactively)
-- SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('20241209','999');
