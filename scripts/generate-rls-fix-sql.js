const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTablesAndGenerateSQL() {
  try {
    console.log('Checking which tables exist in the database...');

    // Use a simple query to check for specific tables
    const tablesToCheck = [
      'profiles',
      'students',
      'classes',
      'enrollments',
      'attendance',
      'student_accounts',
      'invoices',
      'payments',
      'grades'
    ];

    const existingTables = [];

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (!error) {
          existingTables.push(tableName);
          console.log(`✅ ${tableName} exists`);
        } else {
          console.log(`❌ ${tableName} does not exist (${error.code})`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} does not exist (exception)`);
      }
    }

    console.log('\nExisting tables:', existingTables.join(', '));

    // Tables that need RLS policy fixes (from the original migration)
    const tablesNeedingPolicies = [
      'profiles',
      'students',
      'classes',
      'enrollments',
      'attendance',
      'student_accounts',
      'invoices',
      'payments',
      'grades'
    ];

    const tablesToFix = tablesNeedingPolicies.filter(table => existingTables.includes(table));
    console.log('\nTables that need RLS policy fixes:', tablesToFix.join(', '));

    // Generate the SQL
    let sql = `-- Fix infinite recursion in RLS policies
-- Generated: ${new Date().toISOString()}
-- Only fixing policies for existing tables: ${tablesToFix.join(', ')}

-- Create a security definer function to get current user role without triggering RLS
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

`;

    // Profiles policies (always exists)
    sql += `-- Profiles policies
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can update non-admin profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can update non-admin profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'staff')
    AND role NOT IN ('admin', 'staff')
  )
  WITH CHECK (
    public.get_current_user_role() IN ('admin', 'staff')
    AND role NOT IN ('admin', 'staff')
  );

`;

    // Students policies
    if (tablesToFix.includes('students')) {
      sql += `-- Students policies
DROP POLICY IF EXISTS "Staff can view all students" ON public.students;
DROP POLICY IF EXISTS "Staff can manage students" ON public.students;

CREATE POLICY "Staff can view all students"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    // Classes policies
    if (tablesToFix.includes('classes')) {
      sql += `-- Classes policies
DROP POLICY IF EXISTS "Staff can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Staff can manage classes" ON public.classes;

CREATE POLICY "Staff can view all classes"
  ON public.classes FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage classes"
  ON public.classes FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    // Enrollments policies
    if (tablesToFix.includes('enrollments')) {
      sql += `-- Enrollments policies
DROP POLICY IF EXISTS "Staff can manage enrollments" ON public.enrollments;

CREATE POLICY "Staff can manage enrollments"
  ON public.enrollments FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    // Attendance policies
    if (tablesToFix.includes('attendance')) {
      sql += `-- Attendance policies
DROP POLICY IF EXISTS "Staff can view all attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Staff can update attendance" ON public.attendance;

CREATE POLICY "Staff can view all attendance"
  ON public.attendance FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can manage attendance"
  ON public.attendance FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

CREATE POLICY "Staff can update attendance"
  ON public.attendance FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    // Financial policies
    if (tablesToFix.includes('student_accounts')) {
      sql += `-- Student accounts policies
DROP POLICY IF EXISTS "Staff can manage student accounts" ON public.student_accounts;

CREATE POLICY "Staff can manage student accounts"
  ON public.student_accounts FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    if (tablesToFix.includes('invoices')) {
      sql += `-- Invoices policies
DROP POLICY IF EXISTS "Staff can manage invoices" ON public.invoices;

CREATE POLICY "Staff can manage invoices"
  ON public.invoices FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    if (tablesToFix.includes('payments')) {
      sql += `-- Payments policies
DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;

CREATE POLICY "Staff can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    // Grades policies
    if (tablesToFix.includes('grades')) {
      sql += `-- Grades policies
DROP POLICY IF EXISTS "Staff can view all grades" ON public.grades;

CREATE POLICY "Staff can view all grades"
  ON public.grades FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'staff'));

`;
    }

    console.log('\n\n=== SQL TO RUN IN SUPABASE ===\n');
    console.log(sql);
    console.log('\n=== END SQL ===\n');

    console.log(`\nCopy and paste the SQL above into your Supabase SQL Editor:`);
    console.log(`https://mwncwhkdimnjovxzhtjm.supabase.co/project/_/sql`);

  } catch (error) {
    console.error('Script error:', error);
  }
}

checkTablesAndGenerateSQL();