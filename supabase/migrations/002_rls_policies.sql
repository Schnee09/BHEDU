------------------------------------------------------------
-- 🔰 Enable Row Level Security (RLS)
------------------------------------------------------------
alter table profiles enable row level security;
alter table classes enable row level security;
alter table enrollments enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table attendance enable row level security;
alter table scores enable row level security;
alter table ai_feedback enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

------------------------------------------------------------
-- 🔸 PROFILES
------------------------------------------------------------
drop policy if exists "Read own profile" on profiles;
drop policy if exists "Update own profile" on profiles;
drop policy if exists "Insert own profile" on profiles;
drop policy if exists "Admins full access" on profiles;

-- Users can read their own profile
create policy "Read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Allow self insert (first-time registration)
create policy "Insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Allow admins full access (no recursion)
create policy "Admins full access"
  on profiles for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 CLASSES
------------------------------------------------------------
drop policy if exists "Teachers manage own classes" on classes;
drop policy if exists "Students view enrolled classes" on classes;
drop policy if exists "Admins manage all classes" on classes;

create policy "Teachers manage own classes"
  on classes for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);

create policy "Students view enrolled classes"
  on classes for select
  using (
    exists (
      select 1 from enrollments e
      where e.class_id = classes.id
      and e.student_id = auth.uid()
    )
  );

create policy "Admins manage all classes"
  on classes for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ENROLLMENTS
------------------------------------------------------------
drop policy if exists "Students view own enrollments" on enrollments;
drop policy if exists "Teachers view enrollments for own classes" on enrollments;
drop policy if exists "Admins manage enrollments" on enrollments;

create policy "Students view own enrollments"
  on enrollments for select
  using (student_id = auth.uid());

create policy "Teachers view enrollments for own classes"
  on enrollments for select
  using (
    exists (
      select 1 from classes c
      where c.id = enrollments.class_id
      and c.teacher_id = auth.uid()
    )
  );

create policy "Admins manage enrollments"
  on enrollments for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ASSIGNMENTS
------------------------------------------------------------
drop policy if exists "Teachers manage own assignments" on assignments;
drop policy if exists "Students view class assignments" on assignments;
drop policy if exists "Admins manage assignments" on assignments;

create policy "Teachers manage own assignments"
  on assignments for all
  using (
    exists (
      select 1 from classes c
      where c.id = assignments.class_id
      and c.teacher_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from classes c
      where c.id = assignments.class_id
      and c.teacher_id = auth.uid()
    )
  );

create policy "Students view class assignments"
  on assignments for select
  using (
    exists (
      select 1 from enrollments e
      where e.class_id = assignments.class_id
      and e.student_id = auth.uid()
    )
  );

create policy "Admins manage assignments"
  on assignments for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 SUBMISSIONS
------------------------------------------------------------
drop policy if exists "Students submit own" on submissions;
drop policy if exists "Students view own submissions" on submissions;
drop policy if exists "Teachers view submissions for own classes" on submissions;
drop policy if exists "Admins manage submissions" on submissions;

create policy "Students submit own"
  on submissions for insert
  with check (student_id = auth.uid());

create policy "Students view own submissions"
  on submissions for select
  using (student_id = auth.uid());

create policy "Teachers view submissions for own classes"
  on submissions for select
  using (
    exists (
      select 1 from classes c
      join assignments a on a.class_id = c.id
      where a.id = submissions.assignment_id
      and c.teacher_id = auth.uid()
    )
  );

create policy "Admins manage submissions"
  on submissions for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 SCORES
------------------------------------------------------------
drop policy if exists "Students view own scores" on scores;
drop policy if exists "Teachers manage class scores" on scores;
drop policy if exists "Admins manage all scores" on scores;

create policy "Students view own scores"
  on scores for select
  using (student_id = auth.uid());

create policy "Teachers manage class scores"
  on scores for all
  using (
    exists (
      select 1 from classes c
      where c.id = scores.class_id
      and c.teacher_id = auth.uid()
    )
  );

create policy "Admins manage all scores"
  on scores for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 ATTENDANCE
------------------------------------------------------------
drop policy if exists "Students view own attendance" on attendance;
drop policy if exists "Teachers manage attendance" on attendance;
drop policy if exists "Admins manage all attendance" on attendance;

create policy "Students view own attendance"
  on attendance for select
  using (student_id = auth.uid());

create policy "Teachers manage attendance"
  on attendance for all
  using (
    exists (
      select 1 from classes c
      where c.id = attendance.class_id
      and c.teacher_id = auth.uid()
    )
  );

create policy "Admins manage all attendance"
  on attendance for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 AI_FEEDBACK
------------------------------------------------------------
drop policy if exists "Students view own feedback" on ai_feedback;
drop policy if exists "Teachers/Admins view all feedback" on ai_feedback;

create policy "Students view own feedback"
  on ai_feedback for select
  using (student_id = auth.uid());

create policy "Teachers/Admins view all feedback"
  on ai_feedback for select
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 NOTIFICATIONS
------------------------------------------------------------
drop policy if exists "Users view own notifications" on notifications;

create policy "Users view own notifications"
  on notifications for select
  using (target_id = auth.uid());

------------------------------------------------------------
-- 🔸 AUDIT LOGS
------------------------------------------------------------
drop policy if exists "Admins view audit logs" on audit_logs;

create policy "Admins view audit logs"
  on audit_logs for select
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- ✅ End of RLS File (safe, recursion-free)
------------------------------------------------------------
