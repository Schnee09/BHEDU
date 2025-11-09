------------------------------------------------------------
-- 🎓 Courses & Lessons Schema
-- Separate domain for LMS/content library features
-- (Distinct from classes/assignments for classroom management)
------------------------------------------------------------

-- courses table (online learning catalog)
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail text,
  author_id uuid references profiles(id) on delete set null,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- lessons table (course content modules)
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  order_index integer default 0,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_courses_author on courses(author_id);
create index if not exists idx_courses_published on courses(is_published);
create index if not exists idx_lessons_course on lessons(course_id);
create index if not exists idx_lessons_order on lessons(course_id, order_index);

-- Updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_courses_updated_at
  before update on courses
  for each row
  execute function update_updated_at_column();

create trigger update_lessons_updated_at
  before update on lessons
  for each row
  execute function update_updated_at_column();

------------------------------------------------------------
-- ✅ Courses & Lessons Schema Complete
------------------------------------------------------------
