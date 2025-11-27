-- Quick verification queries to confirm migration success

-- 1. Check profiles table columns (should include student fields)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'email', 'date_of_birth', 'phone', 'address', 'emergency_contact')
ORDER BY column_name;

-- 2. Check enrollments table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'enrollments' 
AND column_name IN ('enrollment_date', 'status')
ORDER BY column_name;

-- 3. Check helper functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'is_admin', 'is_teacher', 'is_student', 
  'is_enrolled_in_class', 'has_active_enrollments',
  'get_student_enrollment_count', 'get_class_enrollment_count',
  'is_email_unique', 'batch_insert_enrollments', 'get_student_with_enrollments'
)
ORDER BY routine_name;

-- 4. Check RLS policies on profiles
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Check RLS policies on enrollments
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'enrollments'
ORDER BY policyname;

-- 6. Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('profiles', 'enrollments')
AND indexname LIKE 'idx_%'
ORDER BY indexname;
