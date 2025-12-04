-- ================================================================
-- CHECK DATABASE RELATIONSHIPS AND FOREIGN KEYS
-- ================================================================
-- Run this to see if the foreign key relationships are properly set up
-- ================================================================

-- Check attendance table structure
SELECT 
  '=== ATTENDANCE TABLE ===' as info,
  '' as details
UNION ALL
SELECT 
  'Column name' as info,
  column_name as details
FROM information_schema.columns
WHERE table_name = 'attendance'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints on attendance
SELECT 
  '=== ATTENDANCE FOREIGN KEYS ===' as info,
  '' as details
UNION ALL
SELECT 
  constraint_name as info,
  CONCAT(
    table_name, '.', column_name, ' -> ', 
    foreign_table_name, '.', foreign_column_name
  ) as details
FROM (
  SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'attendance'
    AND tc.table_schema = 'public'
) fk_info;

-- Check assignments table structure
SELECT 
  '=== ASSIGNMENTS TABLE ===' as info,
  '' as details
UNION ALL
SELECT 
  'Column name' as info,
  column_name as details
FROM information_schema.columns
WHERE table_name = 'assignments'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check foreign key constraints on assignments
SELECT 
  '=== ASSIGNMENTS FOREIGN KEYS ===' as info,
  '' as details
UNION ALL
SELECT 
  constraint_name as info,
  CONCAT(
    table_name, '.', column_name, ' -> ',
    foreign_table_name, '.', foreign_column_name
  ) as details
FROM (
  SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'assignments'
    AND tc.table_schema = 'public'
) fk_info;

-- Test a simple attendance query
SELECT 
  '=== TEST QUERY ===' as info,
  '' as details
UNION ALL
SELECT 
  'Attendance count' as info,
  COUNT(*)::TEXT as details
FROM attendance
UNION ALL
SELECT 
  'Assignments count' as info,
  COUNT(*)::TEXT as details
FROM assignments
UNION ALL
SELECT 
  'Classes count' as info,
  COUNT(*)::TEXT as details
FROM classes;
