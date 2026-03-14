-- Drop the old 0-param overload of get_class_averages
-- to avoid PostgreSQL function ambiguity when calling from supabase-js.
-- The new version with DEFAULT NULL parameter handles both cases.
DROP FUNCTION IF EXISTS get_class_averages();
