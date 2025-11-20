# Student CRUD Database Migrations

## 📁 Migration Files

Three new migration files have been created for the student CRUD system:

1. **044_student_management_schema.sql** - Schema enhancements
2. **045_student_management_rls.sql** - Row-level security policies
3. **046_student_management_functions.sql** - Helper functions

## 🚀 How to Apply Migrations

### Option 1: Supabase CLI (Recommended)

```bash
# Navigate to project root
cd e:\TTGDBH\BH-EDU

# Link to your Supabase project (first time only)
supabase link --project-ref your-project-ref

# Apply all pending migrations
supabase db push

# Or apply specific migrations
supabase db push --include 044_student_management_schema.sql
supabase db push --include 045_student_management_rls.sql
supabase db push --include 046_student_management_functions.sql
```

### Option 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste each migration file content in order:
   - First: `044_student_management_schema.sql`
   - Second: `045_student_management_rls.sql`
   - Third: `046_student_management_functions.sql`
5. Click **Run** for each migration

### Option 3: Manual SQL Execution

```bash
# Using psql (if you have direct database access)
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/044_student_management_schema.sql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/045_student_management_rls.sql
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/046_student_management_functions.sql
```

## 📋 What Each Migration Does

### Migration 044: Schema Enhancements

**Purpose**: Ensures all required fields exist in profiles and enrollments tables

**Changes**:
- ✅ Adds `first_name`, `last_name` to profiles (if not exists)
- ✅ Adds `email` to profiles (if not exists)
- ✅ Adds `date_of_birth`, `phone`, `address` to profiles
- ✅ Adds `emergency_contact` to profiles
- ✅ Adds `user_id` reference to auth.users
- ✅ Adds `updated_at` timestamp with auto-update trigger
- ✅ Creates indexes for fast lookups (email, role, name)
- ✅ Adds `enrollment_date` and `status` to enrollments
- ✅ Creates trigger to auto-sync `full_name` from first/last name

**Safe**: Uses `IF NOT EXISTS` checks - won't break existing data

### Migration 045: RLS Policies

**Purpose**: Implements secure row-level access control

**Policies Created**:
- ✅ Service role has full access (for backend API)
- ✅ Authenticated users can read all profiles
- ✅ Users can update their own profile
- ✅ Admins can insert/update/delete any profile
- ✅ Students can view their own enrollments
- ✅ Teachers can view/manage enrollments for their classes
- ✅ Admins can manage all enrollments

**Security**: Follows principle of least privilege

### Migration 046: Helper Functions

**Purpose**: Utility functions for common operations

**Functions Created**:
- ✅ `is_admin(user_id)` - Check if user is admin
- ✅ `is_teacher(user_id)` - Check if user is teacher
- ✅ `is_student(user_id)` - Check if user is student
- ✅ `is_enrolled_in_class(class_id, student_id)` - Check enrollment
- ✅ `has_active_enrollments(student_id)` - Check active enrollments
- ✅ `get_student_enrollment_count(student_id)` - Count enrollments
- ✅ `get_class_enrollment_count(class_id)` - Count students in class
- ✅ `is_email_unique(email, exclude_id)` - Check email uniqueness
- ✅ `batch_insert_enrollments(student_ids, class_id)` - Batch enroll
- ✅ `get_student_with_enrollments(student_id)` - Optimized query

**Performance**: Uses SECURITY DEFINER to bypass RLS for checks

## ✅ Verification

After applying migrations, verify they worked:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('first_name', 'last_name', 'email', 'date_of_birth');

-- Check if indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'profiles';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%student%' OR routine_name LIKE '%enrollment%';

-- Check if policies exist
SELECT policyname 
FROM pg_policies 
WHERE tablename IN ('profiles', 'enrollments');
```

## 🔄 Rollback (If Needed)

If you need to undo the migrations:

```sql
-- Drop functions
DROP FUNCTION IF EXISTS record_exists CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_teacher CASCADE;
DROP FUNCTION IF EXISTS is_student CASCADE;
DROP FUNCTION IF EXISTS is_enrolled_in_class CASCADE;
DROP FUNCTION IF EXISTS has_active_enrollments CASCADE;
DROP FUNCTION IF EXISTS get_student_enrollment_count CASCADE;
DROP FUNCTION IF EXISTS get_class_enrollment_count CASCADE;
DROP FUNCTION IF EXISTS is_email_unique CASCADE;
DROP FUNCTION IF EXISTS batch_insert_enrollments CASCADE;
DROP FUNCTION IF EXISTS get_student_with_enrollments CASCADE;

-- Drop policies (RLS remains enabled)
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Service role full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can view class enrollments" ON enrollments;
DROP POLICY IF EXISTS "Teachers can manage class enrollments" ON enrollments;

-- Note: Don't drop columns as they may have data
-- Only drop columns if absolutely necessary and you've backed up data
```

## 🔒 Security Notes

1. **Service Role**: Backend API uses service_role which bypasses RLS
2. **RLS Enabled**: All tables have RLS enabled for security
3. **SECURITY DEFINER**: Helper functions use SECURITY DEFINER to bypass RLS for checks
4. **Least Privilege**: Users only have access to data they need

## 📊 Performance Tips

1. **Indexes Created**: All foreign keys and frequently queried columns are indexed
2. **Use Helper Functions**: Functions like `get_student_with_enrollments` are optimized
3. **Batch Operations**: Use `batch_insert_enrollments` for multiple students
4. **Avoid N+1**: Helper functions prevent N+1 query problems

## 🧪 Testing

After migration, test with:

```sql
-- Test student creation
INSERT INTO profiles (
  id, first_name, last_name, email, role, date_of_birth
) VALUES (
  gen_random_uuid(),
  'Test',
  'Student',
  'test@example.com',
  'student',
  '2005-01-15'
) RETURNING *;

-- Test helper functions
SELECT is_admin('your-user-id');
SELECT has_active_enrollments('student-id');
SELECT get_class_enrollment_count('class-id');

-- Test enrollment
INSERT INTO enrollments (student_id, class_id, status)
VALUES ('student-id', 'class-id', 'active')
RETURNING *;
```

## 📞 Support

If you encounter issues:

1. Check Supabase logs in Dashboard → Database → Logs
2. Verify your PostgreSQL version (should be 14+)
3. Ensure you have proper permissions
4. Review migration file for SQL errors

## ✨ Benefits

After applying these migrations, you get:

- ✅ Complete student profile schema
- ✅ Secure row-level access control
- ✅ Optimized helper functions
- ✅ Auto-syncing full names
- ✅ Fast queries with indexes
- ✅ Email uniqueness checks
- ✅ Enrollment validation
- ✅ Batch operations support

---

**Ready to deploy!** Apply these migrations and your database will be ready for the student CRUD API. 🚀
