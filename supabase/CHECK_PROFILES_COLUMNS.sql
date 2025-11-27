-- Check what columns actually exist in the profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- This will show you all the actual columns in your profiles table
-- Run this in Supabase SQL Editor to see what columns you have
