# Database Setup Guide

This guide explains how to set up the database schema for the BH-EDU system.

## Prerequisites

- Supabase project created
- Supabase CLI installed (optional, for local development)
- Access to Supabase Dashboard

## Database Schema

The system uses the following main tables for student management:

### 1. Profiles Table

Stores user profile information including students, teachers, and admins.

```sql
-- The profiles table should already exist from Supabase Auth
-- Ensure it has these columns for students:

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create full_name trigger
CREATE OR REPLACE FUNCTION update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := NEW.first_name || ' ' || NEW.last_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_full_name_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_full_name();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Courses Table

```sql
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);

-- Add updated_at trigger
CREATE TRIGGER courses_updated_at_trigger
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Academic Years Table

```sql
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_years_current ON academic_years(is_current);

-- Add updated_at trigger
CREATE TRIGGER academic_years_updated_at_trigger
  BEFORE UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. Classes Table

```sql
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  schedule TEXT,
  room TEXT,
  max_students INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_course ON classes(course_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year_id);

-- Add updated_at trigger
CREATE TRIGGER classes_updated_at_trigger
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 5. Enrollments Table

```sql
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Add updated_at trigger
CREATE TRIGGER enrollments_updated_at_trigger
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 6. Assignments Table

```sql
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  max_points DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

-- Add updated_at trigger
CREATE TRIGGER assignments_updated_at_trigger
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 7. Grades Table

```sql
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points DECIMAL(5,2),
  grade TEXT,
  feedback TEXT,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_grades_assignment ON grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);

-- Add updated_at trigger
CREATE TRIGGER grades_updated_at_trigger
  BEFORE UPDATE ON grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 8. Attendance Table

```sql
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL, -- 'present', 'absent', 'late', 'excused'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- Add updated_at trigger
CREATE TRIGGER attendance_updated_at_trigger
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Row Level Security (RLS)

Enable RLS and set up policies for each table:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read their own profile, admins can do anything
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can do anything with profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Courses: Everyone can read, admins can modify
CREATE POLICY "Everyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can modify courses"
  ON courses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Classes: Everyone can read, teachers can read their classes, admins can modify
CREATE POLICY "Everyone can view classes"
  ON classes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can modify classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Enrollments: Students can view their own, teachers can view their classes, admins can modify
CREATE POLICY "Students can view own enrollments"
  ON enrollments FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins can modify enrollments"
  ON enrollments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grades: Students can view their own, teachers can modify, admins can do anything
CREATE POLICY "Students can view own grades"
  ON grades FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers and admins can modify grades"
  ON grades FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Attendance: Similar to grades
CREATE POLICY "Students can view own attendance"
  ON attendance FOR SELECT
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Teachers and admins can modify attendance"
  ON attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );
```

## Helper Functions

Create security-definer helper functions for privileged operations:

```sql
-- Create student with auth user
CREATE OR REPLACE FUNCTION create_student_with_auth(
  p_email TEXT,
  p_password TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_date_of_birth DATE,
  p_address TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_emergency_contact TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
BEGIN
  -- Create auth user
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  VALUES (
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_user_id;

  -- Create profile
  INSERT INTO profiles (
    user_id,
    email,
    first_name,
    last_name,
    date_of_birth,
    address,
    phone,
    emergency_contact,
    role
  )
  VALUES (
    v_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_date_of_birth,
    p_address,
    p_phone,
    p_emergency_contact,
    'student'
  )
  RETURNING id INTO v_profile_id;

  RETURN v_profile_id;
END;
$$;

-- Delete student and auth user
CREATE OR REPLACE FUNCTION delete_student_with_auth(p_profile_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id
  SELECT user_id INTO v_user_id
  FROM profiles
  WHERE id = p_profile_id;

  -- Delete profile (will cascade to enrollments, grades, etc.)
  DELETE FROM profiles WHERE id = p_profile_id;

  -- Delete auth user
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;
```

## Setup Steps

1. **Via Supabase Dashboard**:
   - Go to your project in Supabase Dashboard
   - Navigate to SQL Editor
   - Copy and paste each section above
   - Execute in order

2. **Via Supabase CLI** (for local development):
   ```bash
   # Initialize Supabase in your project
   supabase init

   # Create migration file
   supabase migration new initial_schema

   # Add the SQL above to the migration file
   # Then apply
   supabase db push
   ```

## Seeding Sample Data

For testing, you can seed some sample data:

```sql
-- Create an admin user (update with your email/password)
INSERT INTO profiles (user_id, email, first_name, last_name, role)
VALUES (
  auth.uid(), -- Your user ID from Supabase Auth
  'admin@example.com',
  'Admin',
  'User',
  'admin'
);

-- Create an academic year
INSERT INTO academic_years (name, start_date, end_date, is_current)
VALUES ('2024-2025', '2024-09-01', '2025-06-30', true);

-- Create a course
INSERT INTO courses (code, name, description, credits, department)
VALUES ('CS101', 'Introduction to Computer Science', 'Learn the basics of programming', 3, 'Computer Science');

-- Create a class (update teacher_id and academic_year_id)
INSERT INTO classes (name, course_id, teacher_id, academic_year_id, schedule, room)
VALUES (
  'CS101 - Section A',
  (SELECT id FROM courses WHERE code = 'CS101'),
  (SELECT id FROM profiles WHERE role = 'teacher' LIMIT 1),
  (SELECT id FROM academic_years WHERE is_current = true),
  'Mon/Wed 10:00-11:30',
  'Room 101'
);
```

## Verification

After setup, verify your database:

1. Check if all tables exist:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

2. Check if RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

3. Test the student CRUD operations via the API endpoints

## Troubleshooting

### Common Issues

1. **RLS blocking queries**: Make sure service role key is used in server-side code
2. **Foreign key violations**: Ensure referenced records exist before creating relationships
3. **Auth user creation fails**: Check Supabase Auth settings and enable manual user creation

### Useful Queries

```sql
-- Count students
SELECT COUNT(*) FROM profiles WHERE role = 'student';

-- Check enrollments
SELECT 
  p.full_name,
  c.name as class_name,
  co.name as course_name,
  e.status
FROM enrollments e
JOIN profiles p ON e.student_id = p.id
JOIN classes c ON e.class_id = c.id
JOIN courses co ON c.course_id = co.id;

-- Check grades
SELECT 
  p.full_name,
  a.title as assignment,
  g.points,
  g.grade
FROM grades g
JOIN profiles p ON g.student_id = p.id
JOIN assignments a ON g.assignment_id = a.id;
```

## Next Steps

After database setup:
1. Configure environment variables (see DEPLOYMENT_CHECKLIST.md)
2. Test API endpoints
3. Create seed data for your specific needs
4. Set up backups and monitoring
