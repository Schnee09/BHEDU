-- CRITICAL FIX: Profile RLS with SECURITY DEFINER function
-- This avoids infinite recursion by using a function that bypasses RLS

-- Step 1: Drop ALL profile policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view students in own classes" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles v2" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view enrolled students" ON public.profiles;
DROP POLICY IF EXISTS "Users always view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers view class students" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profile access policy" ON public.profiles;

-- Step 2: Ensure get_current_user_role function exists and is SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create simple non-recursive policies

-- Policy 1: User can ALWAYS see their OWN profile (direct auth.uid() check, no subquery)
CREATE POLICY "Own profile access"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 2: Admin/Staff can see ALL profiles (uses SECURITY DEFINER function)
CREATE POLICY "Admin staff all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

-- Policy 3: Teachers can see students (simplified - uses function)
CREATE POLICY "Teacher view students"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'teacher' 
    AND role = 'student'
  );

-- Verify policies
SELECT 'Policies created successfully' as status;
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
