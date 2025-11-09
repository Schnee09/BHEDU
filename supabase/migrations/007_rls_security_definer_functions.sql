------------------------------------------------------------
-- 🔧 Complete RLS Fix Using Security Definer Functions
-- This completely eliminates circular dependencies by using
-- functions that bypass RLS when checking permissions
------------------------------------------------------------

-- Drop all existing policies first
drop policy if exists "Teachers manage own classes" on classes;
drop policy if exists "Students view enrolled classes" on classes;
drop policy if exists "Admins manage all classes" on classes;
drop policy if exists "Service role full access classes" on classes;

drop policy if exists "Students view own enrollments" on enrollments;
drop policy if exists "Teachers view enrollments for own classes" on enrollments;
drop policy if exists "Teachers manage enrollments for own classes" on enrollments;
drop policy if exists "Admins manage enrollments" on enrollments;
drop policy if exists "Service role full access enrollments" on enrollments;

drop policy if exists "Teachers manage own assignments" on assignments;
drop policy if exists "Students view class assignments" on assignments;
drop policy if exists "Admins manage assignments" on assignments;
drop policy if exists "Service role full access assignments" on assignments;

drop policy if exists "Students submit own" on submissions;
drop policy if exists "Students view own submissions" on submissions;
drop policy if exists "Teachers view submissions for own classes" on submissions;
drop policy if exists "Teachers grade submissions for own classes" on submissions;
drop policy if exists "Admins manage submissions" on submissions;
drop policy if exists "Service role full access submissions" on submissions;

drop policy if exists "Students view own scores" on scores;
drop policy if exists "Teachers manage class scores" on scores;
drop policy if exists "Admins manage all scores" on scores;
drop policy if exists "Service role full access scores" on scores;

drop policy if exists "Students view own attendance" on attendance;
drop policy if exists "Teachers manage attendance" on attendance;
drop policy if exists "Admins manage all attendance" on attendance;
drop policy if exists "Service role full access attendance" on attendance;

------------------------------------------------------------
-- 🔸 Security Definer Helper Functions (bypass RLS)
------------------------------------------------------------

-- Check if user is teacher of a class
create or replace function is_teacher_of_class(class_id_param uuid, user_id_param uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from classes
    where id = class_id_param
    and teacher_id = user_id_param
  );
$$;

-- Check if user is enrolled in a class
create or replace function is_student_in_class(class_id_param uuid, user_id_param uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from enrollments
    where class_id = class_id_param
    and student_id = user_id_param
  );
$$;

-- Get class_id from assignment_id
create or replace function get_class_from_assignment(assignment_id_param uuid)
returns uuid
language sql
security definer
stable
as $$
  select class_id from assignments where id = assignment_id_param;
$$;

------------------------------------------------------------
-- 🔸 CLASSES - New policies using security definer
------------------------------------------------------------

-- Teachers manage their own classes (direct check, no RLS recursion)
create policy "Teachers manage own classes"
  on classes for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Students view enrolled classes (direct check, no RLS on enrollments)
create policy "Students view enrolled classes"
  on classes for select
  using (is_student_in_class(id, auth.uid()));

-- Service role bypass
create policy "Service role full access classes"
  on classes for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ENROLLMENTS - New policies
------------------------------------------------------------

-- Students view their own enrollments (direct column check)
create policy "Students view own enrollments"
  on enrollments for select
  using (student_id = auth.uid());

-- Teachers view/manage enrollments (uses security definer function)
create policy "Teachers manage enrollments"
  on enrollments for all
  using (is_teacher_of_class(class_id, auth.uid()))
  with check (is_teacher_of_class(class_id, auth.uid()));

-- Service role bypass
create policy "Service role full access enrollments"
  on enrollments for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ASSIGNMENTS - New policies
------------------------------------------------------------

-- Teachers manage assignments (uses security definer function)
create policy "Teachers manage own assignments"
  on assignments for all
  using (is_teacher_of_class(class_id, auth.uid()))
  with check (is_teacher_of_class(class_id, auth.uid()));

-- Students view assignments (uses security definer function)
create policy "Students view class assignments"
  on assignments for select
  using (is_student_in_class(class_id, auth.uid()));

-- Service role bypass
create policy "Service role full access assignments"
  on assignments for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 SUBMISSIONS - New policies
------------------------------------------------------------

-- Students submit their own work (direct check)
create policy "Students submit own"
  on submissions for insert
  with check (student_id = auth.uid());

-- Students view their own submissions (direct check)
create policy "Students view own submissions"
  on submissions for select
  using (student_id = auth.uid());

-- Teachers view/grade submissions (uses security definer functions)
create policy "Teachers manage submissions"
  on submissions for all
  using (is_teacher_of_class(get_class_from_assignment(assignment_id), auth.uid()))
  with check (is_teacher_of_class(get_class_from_assignment(assignment_id), auth.uid()));

-- Service role bypass
create policy "Service role full access submissions"
  on submissions for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 SCORES - New policies
------------------------------------------------------------

-- Students view their own scores (direct check)
create policy "Students view own scores"
  on scores for select
  using (student_id = auth.uid());

-- Teachers manage scores (uses security definer function)
create policy "Teachers manage class scores"
  on scores for all
  using (is_teacher_of_class(class_id, auth.uid()))
  with check (is_teacher_of_class(class_id, auth.uid()));

-- Service role bypass
create policy "Service role full access scores"
  on scores for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ATTENDANCE - New policies
------------------------------------------------------------

-- Students view their own attendance (direct check)
create policy "Students view own attendance"
  on attendance for select
  using (student_id = auth.uid());

-- Teachers manage attendance (uses security definer function)
create policy "Teachers manage attendance"
  on attendance for all
  using (is_teacher_of_class(class_id, auth.uid()))
  with check (is_teacher_of_class(class_id, auth.uid()));

-- Service role bypass
create policy "Service role full access attendance"
  on attendance for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- ✅ RLS Circular Dependency COMPLETELY Fixed
-- 
-- Key changes from 006:
-- 1. Created security definer functions that bypass RLS
-- 2. All cross-table checks now use these functions
-- 3. Zero circular dependencies - functions run with elevated privileges
-- 4. More efficient - functions are marked STABLE for query optimization
------------------------------------------------------------
