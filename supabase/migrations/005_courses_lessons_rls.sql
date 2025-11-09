------------------------------------------------------------
-- 🔐 RLS Policies for Courses & Lessons
------------------------------------------------------------

-- Enable RLS
alter table courses enable row level security;
alter table lessons enable row level security;

------------------------------------------------------------
-- 🔸 COURSES
------------------------------------------------------------
drop policy if exists "Public read published courses" on courses;
drop policy if exists "Authors manage own courses" on courses;
drop policy if exists "Teachers view all courses" on courses;
drop policy if exists "Admins manage all courses" on courses;

-- Anyone can view published courses (for browsing catalog)
create policy "Public read published courses"
  on courses for select
  using (is_published = true);

-- Authors (teachers/admins) can manage their own courses
create policy "Authors manage own courses"
  on courses for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Teachers can view all courses (for reference/assignment)
create policy "Teachers view all courses"
  on courses for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('teacher', 'admin')
    )
  );

-- Admins have full access
create policy "Admins manage all courses"
  on courses for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- 🔸 LESSONS
------------------------------------------------------------
drop policy if exists "Public read published lessons" on lessons;
drop policy if exists "Course authors manage lessons" on lessons;
drop policy if exists "Teachers view all lessons" on lessons;
drop policy if exists "Admins manage all lessons" on lessons;

-- Anyone can view published lessons in published courses
create policy "Public read published lessons"
  on lessons for select
  using (
    is_published = true
    and exists (
      select 1 from courses
      where courses.id = lessons.course_id
      and courses.is_published = true
    )
  );

-- Course authors can manage lessons in their courses
create policy "Course authors manage lessons"
  on lessons for all
  using (
    exists (
      select 1 from courses
      where courses.id = lessons.course_id
      and courses.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from courses
      where courses.id = lessons.course_id
      and courses.author_id = auth.uid()
    )
  );

-- Teachers can view all lessons
create policy "Teachers view all lessons"
  on lessons for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('teacher', 'admin')
    )
  );

-- Admins have full access
create policy "Admins manage all lessons"
  on lessons for all
  using (auth.role() = 'service_role');

------------------------------------------------------------
-- ✅ RLS Policies for Courses & Lessons Complete
------------------------------------------------------------
