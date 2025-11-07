-- schema.sql
-- Extensions
-- create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- profiles (linked to Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','teacher','student')),
  avatar_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- classes
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade text,
  teacher_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- enrollments (student <-> class)
create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  enrolled_at timestamptz default now(),
  left_at timestamptz
);

-- assignments + submissions
create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id),
  title text,
  description text,
  due_date timestamptz,
  created_at timestamptz default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references assignments(id) on delete cascade,
  student_id uuid references profiles(id) on delete cascade,
  file_url text,
  submitted_at timestamptz default now(),
  grade numeric,
  feedback text
);

-- attendance
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id),
  student_id uuid references profiles(id),
  date date,
  status text check (status in ('present','absent','late','excused')),
  remarks text,
  created_at timestamptz default now()
);

-- scores (overall or per-assessment)
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id),
  student_id uuid references profiles(id),
  assignment_id uuid references assignments(id),
  score numeric,
  graded_by uuid references profiles(id),
  graded_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ai_feedback (per student)
create table if not exists ai_feedback (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles(id),
  source text, -- 'weekly_report','auto_detect','teacher_request'
  summary text,
  recommendations jsonb,
  risk_score numeric,
  insight_data jsonb,
  created_at timestamptz default now()
);

-- notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  target_id uuid references profiles(id),
  title text,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- audit log
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  object_type text,
  object_id uuid,
  payload jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_scores_student on scores(student_id);
create index if not exists idx_ai_feedback_student on ai_feedback(student_id);
create index if not exists idx_enrollments_student on enrollments(student_id);
