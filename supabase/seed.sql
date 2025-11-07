-- backend/supabase/seed.sql
-- Option 1: Auth-linked profiles
insert into profiles (id, full_name, role)
select id, 'Admin User', 'admin'
  from auth.users where email = 'admin@demo.com'
union all
select id, 'Teacher A', 'teacher'
  from auth.users where email = 'teacher@demo.com'
union all
select id, 'Student A', 'student'
  from auth.users where email = 'student@demo.com';
