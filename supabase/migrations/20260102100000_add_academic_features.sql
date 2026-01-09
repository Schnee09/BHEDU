-- Academic features: Timetable, Calendar, Semesters, Subjects
-- Run this migration to add academic management tables

-- ============================================
-- Semesters Table
-- ============================================
CREATE TABLE IF NOT EXISTS semesters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- e.g., "2024-2025-HK1"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Subjects Table
-- ============================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- e.g., "MATH", "LIT"
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Timetable/Schedule Table
-- ============================================
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Monday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Academic Calendar Events
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'general', -- general, exam, holiday, meeting, deadline
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  is_all_day BOOLEAN DEFAULT TRUE,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- NULL = all classes
  color TEXT DEFAULT '#6366f1',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_semester ON timetable_slots(semester_id);
CREATE INDEX IF NOT EXISTS idx_timetable_day ON timetable_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_calendar_dates ON calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_semester ON calendar_events(semester_id);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Semesters: Everyone can view, admin can edit
DROP POLICY IF EXISTS "Everyone can view semesters" ON semesters;
CREATE POLICY "Everyone can view semesters" ON semesters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage semesters" ON semesters;
CREATE POLICY "Admin can manage semesters" ON semesters FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Subjects: Everyone can view, admin can edit
DROP POLICY IF EXISTS "Everyone can view subjects" ON subjects;
CREATE POLICY "Everyone can view subjects" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage subjects" ON subjects;
CREATE POLICY "Admin can manage subjects" ON subjects FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Timetable: Everyone can view, admin/teacher can edit
DROP POLICY IF EXISTS "Everyone can view timetable" ON timetable_slots;
CREATE POLICY "Everyone can view timetable" ON timetable_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage timetable" ON timetable_slots;
CREATE POLICY "Staff can manage timetable" ON timetable_slots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- Calendar: Everyone can view, admin can edit
DROP POLICY IF EXISTS "Everyone can view calendar" ON calendar_events;
CREATE POLICY "Everyone can view calendar" ON calendar_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can manage calendar" ON calendar_events;
CREATE POLICY "Admin can manage calendar" ON calendar_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- Seed Data: Default subjects
-- ============================================
INSERT INTO subjects (name, code, description) VALUES
  ('Toán học', 'MATH', 'Môn Toán'),
  ('Ngữ văn', 'LIT', 'Môn Ngữ văn'),
  ('Tiếng Anh', 'ENG', 'Môn Tiếng Anh'),
  ('Vật lý', 'PHY', 'Môn Vật lý'),
  ('Hóa học', 'CHEM', 'Môn Hóa học'),
  ('Môn khác', 'OTHER', 'Các môn học khác')
ON CONFLICT (code) DO NOTHING;

-- Seed Data: Current semester
INSERT INTO semesters (name, code, start_date, end_date, is_active) VALUES
  ('Học kỳ 1 - Năm học 2024-2025', '2024-2025-HK1', '2024-09-05', '2025-01-15', FALSE),
  ('Học kỳ 2 - Năm học 2024-2025', '2024-2025-HK2', '2025-01-20', '2025-05-31', TRUE)
ON CONFLICT (code) DO NOTHING;
