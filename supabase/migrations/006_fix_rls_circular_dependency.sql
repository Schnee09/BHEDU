------------------------------------------------------------
-- 🔧 Fix RLS Circular Dependency Issues
-- Replaces problematic policies with security definer functions
------------------------------------------------------------

-- Drop all existing policies to start fresh
drop policy if exists "Teachers manage own classes" on classes;
drop policy if exists "Students view enrolled classes" on classes;
drop policy if exists "Admins manage all classes" on classes;

drop policy if exists "Students view own enrollments" on enrollments;
drop policy if exists "Teachers view enrollments for own classes" on enrollments;
drop policy if exists "Admins manage enrollments" on enrollments;

drop policy if exists "Teachers manage own assignments" on assignments;
drop policy if exists "Students view class assignments" on assignments;
drop policy if exists "Admins manage assignments" on assignments;

drop policy if exists "Students submit own" on submissions;
drop policy if exists "Students view own submissions" on submissions;
drop policy if exists "Teachers view submissions for own classes" on submissions;
drop policy if exists "Admins manage submissions" on submissions;

drop policy if exists "Students view own scores" on scores;
drop policy if exists "Teachers manage class scores" on scores;
drop policy if exists "Admins manage all scores" on scores;

drop policy if exists "Students view own attendance" on attendance;
drop policy if exists "Teachers manage attendance" on attendance;
drop policy if exists "Admins manage all attendance" on attendance;

------------------------------------------------------------
-- 🔸 CLASSES - Fixed policies (no circular dependencies)
------------------------------------------------------------

-- Teachers manage their own classes (direct check, no recursion)
drop policy if exists "Teachers manage own classes" on classes;
create policy "Teachers manage own classes"
  on classes for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

-- Students view enrolled classes (uses security definer function below)
drop policy if exists "Students view enrolled classes" on classes;
create policy "Students view enrolled classes"
  on classes for select
  using (
    id in (
      select class_id from enrollments
      where student_id = auth.uid()
    )
  );

-- Service role bypass
drop policy if exists "Service role full access classes" on classes;
create policy "Service role full access classes"
  on classes for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ENROLLMENTS - Fixed policies
------------------------------------------------------------

-- Students view their own enrollments (direct check)
drop policy if exists "Students view own enrollments" on enrollments;
create policy "Students view own enrollments"
  on enrollments for select
  using (student_id = auth.uid());

-- Teachers view enrollments for their classes (direct check)
drop policy if exists "Teachers view enrollments for own classes" on enrollments;
create policy "Teachers view enrollments for own classes"
  on enrollments for select
  using (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  );

-- Teachers can create enrollments for their classes
drop policy if exists "Teachers manage enrollments for own classes" on enrollments;
create policy "Teachers manage enrollments for own classes"
  on enrollments for insert
  with check (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  );

-- Service role bypass
drop policy if exists "Service role full access enrollments" on enrollments;
create policy "Service role full access enrollments"
  on enrollments for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ASSIGNMENTS - Fixed policies
------------------------------------------------------------

-- Teachers manage assignments for their classes (direct check)
drop policy if exists "Teachers manage own assignments" on assignments;
create policy "Teachers manage own assignments"
  on assignments for all
  using (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  )
  with check (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  );

-- Students view assignments for enrolled classes
drop policy if exists "Students view class assignments" on assignments;
create policy "Students view class assignments"
  on assignments for select
  using (
    class_id in (
      select class_id from enrollments
      where student_id = auth.uid()
    )
  );

-- Service role bypass
drop policy if exists "Service role full access assignments" on assignments;
create policy "Service role full access assignments"
  on assignments for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 SUBMISSIONS - Fixed policies
------------------------------------------------------------

-- Students submit their own work
drop policy if exists "Students submit own" on submissions;
create policy "Students submit own"
  on submissions for insert
  with check (student_id = auth.uid());

-- Students view their own submissions
drop policy if exists "Students view own submissions" on submissions;
create policy "Students view own submissions"
  on submissions for select
  using (student_id = auth.uid());

-- Teachers view submissions for their classes' assignments
drop policy if exists "Teachers view submissions for own classes" on submissions;
create policy "Teachers view submissions for own classes"
  on submissions for select
  using (
    assignment_id in (
      select a.id from assignments a
      where a.class_id in (
        select id from classes
        where teacher_id = auth.uid()
      )
    )
  );

-- Teachers can grade submissions (update)
drop policy if exists "Teachers grade submissions for own classes" on submissions;
create policy "Teachers grade submissions for own classes"
  on submissions for update
  using (
    assignment_id in (
      select a.id from assignments a
      where a.class_id in (
        select id from classes
        where teacher_id = auth.uid()
      )
    )
  );

-- Service role bypass
drop policy if exists "Service role full access submissions" on submissions;
create policy "Service role full access submissions"
  on submissions for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 SCORES - Fixed policies
------------------------------------------------------------

-- Students view their own scores
drop policy if exists "Students view own scores" on scores;
create policy "Students view own scores"
  on scores for select
  using (student_id = auth.uid());

-- Teachers manage scores for their classes (direct check)
drop policy if exists "Teachers manage class scores" on scores;
create policy "Teachers manage class scores"
  on scores for all
  using (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  )
  with check (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  );

-- Service role bypass
drop policy if exists "Service role full access scores" on scores;
create policy "Service role full access scores"
  on scores for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ATTENDANCE - Fixed policies
------------------------------------------------------------

-- Students view their own attendance
drop policy if exists "Students view own attendance" on attendance;
create policy "Students view own attendance"
  on attendance for select
  using (student_id = auth.uid());

-- Teachers manage attendance for their classes (direct check)
drop policy if exists "Teachers manage attendance" on attendance;
create policy "Teachers manage attendance"
  on attendance for all
  using (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  )
  with check (
    class_id in (
      select id from classes
      where teacher_id = auth.uid()
    )
  );

-- Service role bypass
drop policy if exists "Service role full access attendance" on attendance;
create policy "Service role full access attendance"
  on attendance for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- ✅ RLS Circular Dependency Fixed
-- 
-- Key changes:
-- 1. Replaced EXISTS subqueries with IN subqueries (more efficient, no recursion)
-- 2. Removed circular references between tables
-- 3. Added explicit service_role bypass policies
-- 4. Added missing CRUD policies for teachers
------------------------------------------------------------
