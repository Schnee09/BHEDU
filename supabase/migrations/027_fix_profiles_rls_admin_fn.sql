-- 027: Fix profiles RLS infinite recursion by using a security definer function
-- Date: 2025-11-16

-- Helper function that checks if current user is admin without triggering RLS recursion
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

-- Replace recursive policy on profiles that referenced profiles inside USING
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles (fn)"
  on public.profiles for select
  using (public.is_admin());

-- Keep self-read policy in place (from 025)
-- create policy "Users read own full profile" exists already

-- Optional: allow teachers/admins to be readable for class displays (already present)
-- create policy "Read teacher profiles" exists already
