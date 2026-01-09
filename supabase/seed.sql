-- ============================================
-- BH-EDU Complete Seed Data
-- ============================================
-- Run after migrations with: supabase db reset
-- Or manually via Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. SEMESTERS
-- ============================================
INSERT INTO semesters (name, code, start_date, end_date, is_active) VALUES
  ('Học kỳ 1 - Năm học 2024-2025', '2024-2025-HK1', '2024-09-05', '2025-01-15', FALSE),
  ('Học kỳ 2 - Năm học 2024-2025', '2024-2025-HK2', '2025-01-20', '2025-05-31', TRUE)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. ACADEMIC YEARS
-- ============================================
INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES
  ('Năm học 2024-2025', '2024-09-05', '2025-05-31', TRUE),
  ('Năm học 2023-2024', '2023-09-05', '2024-05-31', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. SUBJECTS (6 core subjects)
-- ============================================
INSERT INTO subjects (name, code, description) VALUES
  ('Toán học', 'TOAN', 'Môn Toán'),
  ('Ngữ văn', 'VAN', 'Môn Ngữ văn'),
  ('Tiếng Anh', 'ANH', 'Môn Tiếng Anh'),
  ('Vật lý', 'LY', 'Môn Vật lý'),
  ('Hóa học', 'HOA', 'Môn Hóa học'),
  ('Môn khác', 'KHAC', 'Môn học khác')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 4. SCHOOL SETTINGS
-- ============================================
INSERT INTO school_settings (key, value, description) VALUES
  ('school_name', 'Trung tâm Giáo dục Bùi Hoàng', 'Tên trường'),
  ('school_address', 'TP. Hồ Chí Minh, Việt Nam', 'Địa chỉ trung tâm'),
  ('school_phone', '028-1234-5678', 'Số điện thoại'),
  ('school_email', 'contact@bhedu.vn', 'Email liên hệ'),
  ('school_website', 'https://bhedu.vn', 'Website'),
  ('academic_year', '2024-2025', 'Năm học hiện tại'),
  ('grading_scale', '10', 'Thang điểm (10)'),
  ('passing_grade', '5.0', 'Điểm đạt tối thiểu'),
  ('semester', '2', 'Học kỳ hiện tại')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- 5. CLASSES
-- ============================================
INSERT INTO classes (name) VALUES
  ('10A1'), ('10A2'), ('10A3'),
  ('11A1'), ('11A2'), ('11A3'),
  ('12A1'), ('12A2'), ('12A3'),
  ('6A'), ('6B'),
  ('7A'), ('7B'),
  ('8A'), ('8B'),
  ('9A'), ('9B')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. TEST ACCOUNTS
-- ============================================
-- DO NOT create profiles directly here!
-- Profiles must be linked to Supabase Auth users.
-- 
-- Use the JavaScript seeder instead:
--   node scripts/seed-complete.js
--
-- This will properly create:
--   1. Auth users in Supabase Auth
--   2. Linked profiles in the profiles table
-- ============================================

-- ============================================
-- 7. FEE TYPES (for finance module)
-- ============================================
INSERT INTO fee_types (name, code, category, description) VALUES
  ('Học phí', 'HOCPHI', 'tuition', 'Học phí hàng tháng'),
  ('Phí cơ sở vật chất', 'CSVC', 'facility', 'Phí sử dụng cơ sở vật chất'),
  ('Phí hoạt động', 'HOATDONG', 'activity', 'Phí hoạt động ngoại khóa'),
  ('Phí thi', 'PHI_THI', 'exam', 'Phí thi, kiểm tra'),
  ('Phí khác', 'KHAC', 'other', 'Các loại phí khác')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DONE
-- ============================================
SELECT 'Seed data inserted successfully!' AS status;
