-- 029: Admin SELECT RLS for classes and attendance using security definer is_admin()
-- Date: 2025-11-16

-- Ensure helper exists (from 027)
-- create or replace function public.is_admin(...) already created in 027

-- Classes: allow admins to read all
drop policy if exists "Admins read all classes" on public.classes;
create policy "Admins read all classes"
  on public.classes for select
  using (public.is_admin());

-- Attendance: allow admins to read all (use non-recursive helper)
drop policy if exists "Admins read all attendance (fn)" on public.attendance;
create policy "Admins read all attendance (fn)"
  on public.attendance for select
  using (public.is_admin());
