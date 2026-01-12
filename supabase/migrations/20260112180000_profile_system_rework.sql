-- Migration: Profile System Rework
-- Created: 2026-01-12
-- Purpose: Separate student and teacher profiles, add tutor support

-- ============================================
-- PHASE 1: CREATE TEACHER_PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS teacher_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  teacher_type TEXT NOT NULL DEFAULT 'full_time' 
    CHECK (teacher_type IN ('full_time', 'part_time', 'tutor')),
  department TEXT,
  specialization TEXT,  -- Subjects they can teach (JSON array or comma-separated)
  teaching_subjects UUID[],  -- Array of subject IDs they can teach
  hourly_rate DECIMAL(10,2),  -- For tutors
  bio TEXT,  -- Short introduction
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_type ON teacher_profiles(teacher_type);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_profile_id ON teacher_profiles(profile_id);

-- ============================================
-- PHASE 2: CREATE STUDENT_PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_code VARCHAR UNIQUE,
  grade_level TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  parent_name TEXT,
  parent_phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_student_profiles_profile_id ON student_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_code ON student_profiles(student_code);

-- ============================================
-- PHASE 3: MIGRATE EXISTING DATA
-- ============================================

-- Migrate existing students
INSERT INTO student_profiles (profile_id, student_code, grade_level, enrollment_date)
SELECT id, student_code, grade_level, enrollment_date 
FROM profiles 
WHERE role = 'student'
ON CONFLICT (profile_id) DO NOTHING;

-- Migrate existing teachers as full_time
INSERT INTO teacher_profiles (profile_id, teacher_type, department)
SELECT id, 'full_time', department 
FROM profiles 
WHERE role = 'teacher'
ON CONFLICT (profile_id) DO NOTHING;

-- ============================================
-- PHASE 4: CREATE HELPER VIEW
-- ============================================

-- View for easy access to tutors
CREATE OR REPLACE VIEW tutors AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.phone,
  p.photo_url,
  tp.teacher_type,
  tp.specialization,
  tp.teaching_subjects,
  tp.hourly_rate,
  tp.bio
FROM profiles p
JOIN teacher_profiles tp ON p.id = tp.profile_id
WHERE tp.teacher_type = 'tutor';

-- View for all teachers (including tutors)
CREATE OR REPLACE VIEW all_teachers AS
SELECT 
  p.id,
  p.user_id,
  p.full_name,
  p.email,
  p.phone,
  p.photo_url,
  p.department,
  tp.teacher_type,
  tp.specialization,
  tp.teaching_subjects,
  tp.hourly_rate,
  tp.bio,
  CASE 
    WHEN tp.teacher_type = 'tutor' THEN 'Gia sư'
    WHEN tp.teacher_type = 'part_time' THEN 'Thỉnh giảng'
    ELSE 'Giáo viên'
  END AS display_type
FROM profiles p
LEFT JOIN teacher_profiles tp ON p.id = tp.profile_id
WHERE p.role = 'teacher';

-- ============================================
-- PHASE 5: RLS POLICIES
-- ============================================

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Teacher profiles: staff can manage, teachers can view their own
CREATE POLICY "Staff can manage teacher_profiles" ON teacher_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Teachers can view own profile" ON teacher_profiles
  FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Student profiles: staff can manage, students can view their own
CREATE POLICY "Staff can manage student_profiles" ON student_profiles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Students can view own profile" ON student_profiles
  FOR SELECT TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- DONE
-- ============================================
SELECT 'Profile system rework complete!' AS status;
