-- Comprehensive Seed Data for BH-EDU Platform
-- Run this after creating users in Supabase Auth
-- 
-- IMPORTANT: First create these users in Supabase Auth Dashboard:
-- 1. admin@bhedu.example.com (password: Admin123!)
-- 2. john.doe@bhedu.example.com (password: Teacher123!)
-- 3. emily.johnson@bhedu.example.com (password: Teacher123!)
-- 4. alice.anderson@student.bhedu.example.com (password: Student123!)
-- 5. bob.martinez@student.bhedu.example.com (password: Student123!)
-- ... etc
--
-- Then run: psql -d your_db < supabase/seed_comprehensive.sql
-- Or: npx supabase db reset (will run migrations + seed)

-- ============================================================================
-- CLEANUP: Clear existing data (careful in production!)
-- ============================================================================

TRUNCATE TABLE payment_allocations, payments, invoices, student_accounts CASCADE;
TRUNCATE TABLE qr_codes CASCADE;
TRUNCATE TABLE scores, submissions, assignment_categories, assignments CASCADE;
TRUNCATE TABLE grades CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE guardians CASCADE;
TRUNCATE TABLE classes CASCADE;
TRUNCATE TABLE import_errors, import_logs CASCADE;
TRUNCATE TABLE user_activity_logs, audit_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE grading_scales, academic_years, school_settings CASCADE;
TRUNCATE TABLE fee_types, payment_methods, payment_schedules CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- ============================================================================
-- SCHOOL SETTINGS & CONFIGURATION
-- ============================================================================

INSERT INTO school_settings (id, school_name, address, phone, email, academic_year, semester, logo_url, timezone, currency, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Bright Horizons Educational Institute',
  '123 Education Street, Learning City, LC 12345',
  '+1-555-0100',
  'info@bhedu.example.com',
  '2024-2025',
  'Fall 2024',
  'https://placehold.co/200x200/1e40af/white?text=BH-EDU',
  'America/New_York',
  'USD',
  NOW(),
  NOW()
);

-- Academic Years
INSERT INTO academic_years (id, name, start_date, end_date, is_current, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '2023-2024', '2023-09-01', '2024-06-30', false, NOW(), NOW()),
  (gen_random_uuid(), '2024-2025', '2024-09-01', '2025-06-30', true, NOW(), NOW()),
  (gen_random_uuid(), '2025-2026', '2025-09-01', '2026-06-30', false, NOW(), NOW());

-- Grading Scales
INSERT INTO grading_scales (id, name, min_score, max_score, grade, gpa, description, is_default, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'A+', 97, 100, 'A+', 4.0, 'Excellent', true, NOW(), NOW()),
  (gen_random_uuid(), 'A', 93, 96, 'A', 4.0, 'Excellent', true, NOW(), NOW()),
  (gen_random_uuid(), 'A-', 90, 92, 'A-', 3.7, 'Very Good', true, NOW(), NOW()),
  (gen_random_uuid(), 'B+', 87, 89, 'B+', 3.3, 'Good', true, NOW(), NOW()),
  (gen_random_uuid(), 'B', 83, 86, 'B', 3.0, 'Good', true, NOW(), NOW()),
  (gen_random_uuid(), 'B-', 80, 82, 'B-', 2.7, 'Satisfactory', true, NOW(), NOW()),
  (gen_random_uuid(), 'C+', 77, 79, 'C+', 2.3, 'Satisfactory', true, NOW(), NOW()),
  (gen_random_uuid(), 'C', 73, 76, 'C', 2.0, 'Acceptable', true, NOW(), NOW()),
  (gen_random_uuid(), 'C-', 70, 72, 'C-', 1.7, 'Acceptable', true, NOW(), NOW()),
  (gen_random_uuid(), 'D', 60, 69, 'D', 1.0, 'Below Average', true, NOW(), NOW()),
  (gen_random_uuid(), 'F', 0, 59, 'F', 0.0, 'Failing', true, NOW(), NOW());

-- ============================================================================
-- PROFILES - Link to Supabase Auth users
-- ============================================================================

-- Admin (will match auth.users by email)
INSERT INTO profiles (id, full_name, role, avatar_url, email, phone, address, created_at, updated_at)
SELECT 
  au.id,
  'System Administrator',
  'admin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  au.email,
  '+1-555-0101',
  '100 Admin Avenue',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'admin@bhedu.example.com';

-- Teachers
INSERT INTO profiles (id, full_name, role, avatar_url, email, phone, address, created_at, updated_at)
SELECT 
  au.id,
  CASE au.email
    WHEN 'john.doe@bhedu.example.com' THEN 'John Doe'
    WHEN 'emily.johnson@bhedu.example.com' THEN 'Emily Johnson'
    WHEN 'michael.brown@bhedu.example.com' THEN 'Michael Brown'
    WHEN 'sarah.davis@bhedu.example.com' THEN 'Sarah Davis'
  END,
  'teacher',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || au.email,
  au.email,
  '+1-555-020' || (ROW_NUMBER() OVER()),
  '200 Teacher Lane #' || (ROW_NUMBER() OVER()),
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email IN (
  'john.doe@bhedu.example.com',
  'emily.johnson@bhedu.example.com',
  'michael.brown@bhedu.example.com',
  'sarah.davis@bhedu.example.com'
);

-- Students
INSERT INTO profiles (id, full_name, role, avatar_url, email, phone, address, date_of_birth, created_at, updated_at)
SELECT 
  au.id,
  CASE au.email
    WHEN 'alice.anderson@student.bhedu.example.com' THEN 'Alice Anderson'
    WHEN 'bob.martinez@student.bhedu.example.com' THEN 'Bob Martinez'
    WHEN 'charlie.wilson@student.bhedu.example.com' THEN 'Charlie Wilson'
    WHEN 'diana.lee@student.bhedu.example.com' THEN 'Diana Lee'
    WHEN 'ethan.taylor@student.bhedu.example.com' THEN 'Ethan Taylor'
    WHEN 'fiona.garcia@student.bhedu.example.com' THEN 'Fiona Garcia'
    WHEN 'george.harris@student.bhedu.example.com' THEN 'George Harris'
    WHEN 'hannah.clark@student.bhedu.example.com' THEN 'Hannah Clark'
  END,
  'student',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=' || au.email,
  au.email,
  '+1-555-030' || (ROW_NUMBER() OVER()),
  '300 Student Street #' || (ROW_NUMBER() OVER()),
  DATE '2008-01-01' + (RANDOM() * 365 * 2)::int,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email LIKE '%@student.bhedu.example.com';

-- ============================================================================
-- CLASSES
-- ============================================================================

INSERT INTO classes (id, name, description, teacher_id, schedule, room, capacity, academic_year, semester, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  name,
  description,
  (SELECT id FROM profiles WHERE email = teacher_email LIMIT 1),
  schedule,
  room,
  capacity,
  '2024-2025',
  'Fall 2024',
  NOW(),
  NOW()
FROM (VALUES
  ('Mathematics 101', 'Introduction to Algebra and Geometry', 'john.doe@bhedu.example.com', 'Mon/Wed/Fri 9:00-10:00 AM', 'Room 101', 30),
  ('English Literature', 'Classic and Modern Literature', 'emily.johnson@bhedu.example.com', 'Tue/Thu 10:00-11:30 AM', 'Room 201', 25),
  ('Science Lab', 'Physics and Chemistry Fundamentals', 'michael.brown@bhedu.example.com', 'Mon/Wed 1:00-3:00 PM', 'Lab 301', 20),
  ('History & Social Studies', 'World History and Geography', 'sarah.davis@bhedu.example.com', 'Tue/Thu 2:00-3:30 PM', 'Room 401', 30),
  ('Advanced Mathematics', 'Calculus and Statistics', 'john.doe@bhedu.example.com', 'Mon/Wed/Fri 11:00-12:00 PM', 'Room 102', 20)
) AS t(name, description, teacher_email, schedule, room, capacity);

-- ============================================================================
-- ENROLLMENTS
-- ============================================================================

-- Enroll students in classes (realistic distribution)
WITH class_list AS (
  SELECT id as class_id, name as class_name, ROW_NUMBER() OVER() as class_num
  FROM classes
),
student_list AS (
  SELECT id as student_id, full_name, ROW_NUMBER() OVER() as student_num
  FROM profiles
  WHERE role = 'student'
)
INSERT INTO enrollments (id, student_id, class_id, enrollment_date, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  sl.student_id,
  cl.class_id,
  '2024-09-01'::date,
  'active',
  NOW(),
  NOW()
FROM student_list sl
CROSS JOIN class_list cl
WHERE 
  -- Each student takes 3-4 classes
  (sl.student_num + cl.class_num) % 3 != 0
LIMIT 24; -- Adjust based on student/class count

-- ============================================================================
-- ATTENDANCE RECORDS (Last 2 weeks)
-- ============================================================================

INSERT INTO attendance (id, class_id, student_id, date, status, notes, marked_by, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  e.class_id,
  e.student_id,
  d.date,
  CASE 
    WHEN RANDOM() < 0.85 THEN 'present'
    WHEN RANDOM() < 0.95 THEN 'late'
    ELSE 'absent'
  END,
  CASE WHEN RANDOM() < 0.1 THEN 'Medical excuse' ELSE NULL END,
  c.teacher_id,
  NOW(),
  NOW()
FROM enrollments e
JOIN classes c ON e.class_id = c.id
CROSS JOIN (
  SELECT generate_series(
    CURRENT_DATE - INTERVAL '14 days',
    CURRENT_DATE,
    INTERVAL '1 day'
  )::date as date
) d
WHERE e.status = 'active'
  AND EXTRACT(DOW FROM d.date) BETWEEN 1 AND 5; -- Weekdays only

-- ============================================================================
-- ASSIGNMENT CATEGORIES
-- ============================================================================

INSERT INTO assignment_categories (id, class_id, name, weight, description, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  cat.name,
  cat.weight,
  cat.description,
  NOW(),
  NOW()
FROM classes c
CROSS JOIN (VALUES
  ('Homework', 30, 'Regular homework assignments'),
  ('Quizzes', 20, 'Short quizzes'),
  ('Exams', 40, 'Major exams'),
  ('Participation', 10, 'Class participation')
) AS cat(name, weight, description);

-- ============================================================================
-- ASSIGNMENTS
-- ============================================================================

INSERT INTO assignments (id, class_id, category_id, title, description, due_date, max_score, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  c.id,
  ac.id,
  CASE ac.name
    WHEN 'Homework' THEN c.name || ' - Chapter ' || (n+1) || ' Homework'
    WHEN 'Quizzes' THEN c.name || ' - Quiz ' || (n+1)
    WHEN 'Exams' THEN c.name || ' - ' || CASE WHEN n = 0 THEN 'Midterm' ELSE 'Final' END || ' Exam'
    WHEN 'Participation' THEN c.name || ' - Participation Week ' || (n+1)
  END,
  'Complete the assigned work',
  CURRENT_DATE + (n * 7 - 14) * INTERVAL '1 day',
  CASE ac.name
    WHEN 'Homework' THEN 100
    WHEN 'Quizzes' THEN 50
    WHEN 'Exams' THEN 200
    WHEN 'Participation' THEN 10
  END,
  NOW(),
  NOW()
FROM classes c
JOIN assignment_categories ac ON ac.class_id = c.id
CROSS JOIN generate_series(0, 2) AS n
WHERE (ac.name = 'Exams' AND n < 2) OR (ac.name != 'Exams' AND n < 3);

-- ============================================================================
-- SUBMISSIONS & SCORES
-- ============================================================================

-- Create submissions for past assignments
WITH past_assignments AS (
  SELECT a.id, a.class_id, a.max_score
  FROM assignments a
  WHERE a.due_date < CURRENT_DATE
)
INSERT INTO submissions (id, assignment_id, student_id, submitted_at, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  pa.id,
  e.student_id,
  (SELECT due_date FROM assignments WHERE id = pa.id) - INTERVAL '1 day',
  'graded',
  NOW(),
  NOW()
FROM past_assignments pa
JOIN enrollments e ON e.class_id = pa.class_id
WHERE RANDOM() < 0.9; -- 90% submission rate

-- Grade the submissions
INSERT INTO scores (id, submission_id, score, feedback, graded_by, graded_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  s.id,
  (RANDOM() * 0.3 + 0.7) * a.max_score, -- 70-100% range
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Excellent work!'
    WHEN RANDOM() < 0.6 THEN 'Good job!'
    ELSE 'Keep it up!'
  END,
  c.teacher_id,
  NOW(),
  NOW(),
  NOW()
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN classes c ON a.class_id = c.id
WHERE s.status = 'graded';

-- ============================================================================
-- GRADES (Current grades)
-- ============================================================================

INSERT INTO grades (id, student_id, class_id, grade, gpa, semester, academic_year, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  e.student_id,
  e.class_id,
  CASE 
    WHEN avg_score >= 93 THEN 'A'
    WHEN avg_score >= 90 THEN 'A-'
    WHEN avg_score >= 87 THEN 'B+'
    WHEN avg_score >= 83 THEN 'B'
    WHEN avg_score >= 80 THEN 'B-'
    WHEN avg_score >= 77 THEN 'C+'
    WHEN avg_score >= 73 THEN 'C'
    ELSE 'C-'
  END,
  CASE 
    WHEN avg_score >= 93 THEN 4.0
    WHEN avg_score >= 90 THEN 3.7
    WHEN avg_score >= 87 THEN 3.3
    WHEN avg_score >= 83 THEN 3.0
    WHEN avg_score >= 80 THEN 2.7
    WHEN avg_score >= 77 THEN 2.3
    WHEN avg_score >= 73 THEN 2.0
    ELSE 1.7
  END,
  'Fall 2024',
  '2024-2025',
  NOW(),
  NOW()
FROM enrollments e
LEFT JOIN (
  SELECT 
    e2.student_id,
    a.class_id,
    AVG(sc.score / a.max_score * 100) as avg_score
  FROM submissions s
  JOIN assignments a ON s.assignment_id = a.id
  JOIN scores sc ON sc.submission_id = s.id
  JOIN enrollments e2 ON e2.student_id = s.student_id AND e2.class_id = a.class_id
  GROUP BY e2.student_id, a.class_id
) avg_grades ON avg_grades.student_id = e.student_id AND avg_grades.class_id = e.class_id
WHERE avg_score IS NOT NULL;

-- ============================================================================
-- GUARDIANS
-- ============================================================================

INSERT INTO guardians (id, student_id, name, relationship, phone, email, address, is_primary, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  CASE 
    WHEN RANDOM() < 0.5 THEN SPLIT_PART(p.full_name, ' ', 2) || ' (Parent)'
    ELSE 'Guardian of ' || p.full_name
  END,
  CASE 
    WHEN RANDOM() < 0.4 THEN 'mother'
    WHEN RANDOM() < 0.8 THEN 'father'
    ELSE 'guardian'
  END,
  '+1-555-' || LPAD(floor(RANDOM() * 10000)::text, 4, '0'),
  'parent.' || LOWER(REPLACE(p.full_name, ' ', '.')) || '@example.com',
  p.address,
  true,
  NOW(),
  NOW()
FROM profiles p
WHERE p.role = 'student';

-- ============================================================================
-- FINANCE SETUP
-- ============================================================================

-- Fee Types
INSERT INTO fee_types (id, name, description, amount, frequency, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Tuition', 'Regular tuition fee', 5000.00, 'semester', true, NOW(), NOW()),
  (gen_random_uuid(), 'Lab Fee', 'Science laboratory materials', 200.00, 'semester', true, NOW(), NOW()),
  (gen_random_uuid(), 'Technology Fee', 'Computer lab and software', 150.00, 'semester', true, NOW(), NOW()),
  (gen_random_uuid(), 'Library Fee', 'Library resources', 100.00, 'semester', true, NOW(), NOW()),
  (gen_random_uuid(), 'Activity Fee', 'Student activities', 75.00, 'semester', true, NOW(), NOW());

-- Payment Methods
INSERT INTO payment_methods (id, name, description, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Cash', 'Cash payment', true, NOW(), NOW()),
  (gen_random_uuid(), 'Credit Card', 'Credit/Debit card', true, NOW(), NOW()),
  (gen_random_uuid(), 'Bank Transfer', 'Direct transfer', true, NOW(), NOW()),
  (gen_random_uuid(), 'Check', 'Check payment', true, NOW(), NOW());

-- Payment Schedules
INSERT INTO payment_schedules (id, name, description, due_date, academic_year, semester, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Fall 2024 - First', 'First installment', '2024-09-15', '2024-2025', 'Fall 2024', true, NOW(), NOW()),
  (gen_random_uuid(), 'Fall 2024 - Second', 'Second installment', '2024-10-15', '2024-2025', 'Fall 2024', true, NOW(), NOW()),
  (gen_random_uuid(), 'Fall 2024 - Final', 'Final installment', '2024-11-15', '2024-2025', 'Fall 2024', true, NOW(), NOW());

-- Student Accounts
INSERT INTO student_accounts (id, student_id, balance, total_charged, total_paid, last_payment_date, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  CASE WHEN RANDOM() < 0.7 THEN 0 ELSE (RANDOM() * 1500)::decimal(10,2) END,
  5525.00,
  CASE WHEN RANDOM() < 0.7 THEN 5525.00 ELSE (RANDOM() * 4000 + 1525)::decimal(10,2) END,
  CURRENT_DATE - (RANDOM() * 60)::int,
  NOW(),
  NOW()
FROM profiles p
WHERE p.role = 'student';

-- Invoices
INSERT INTO invoices (id, student_id, invoice_number, due_date, total_amount, paid_amount, status, notes, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  sa.student_id,
  'INV-2024-' || LPAD((ROW_NUMBER() OVER())::text, 4, '0'),
  '2024-12-31',
  sa.total_charged,
  sa.total_paid,
  CASE 
    WHEN sa.balance = 0 THEN 'paid'
    WHEN sa.total_paid > 0 THEN 'partial'
    ELSE 'unpaid'
  END,
  'Fall 2024 Semester Fees',
  NOW(),
  NOW()
FROM student_accounts sa;

-- Payments
INSERT INTO payments (id, student_id, invoice_id, amount, payment_method_id, payment_date, reference_number, notes, status, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  i.student_id,
  i.id,
  i.paid_amount / (1 + floor(RANDOM() * 2)), -- Split into 1-2 payments
  (SELECT id FROM payment_methods ORDER BY RANDOM() LIMIT 1),
  CURRENT_DATE - (RANDOM() * 90)::int,
  'PAY-' || LPAD(floor(RANDOM() * 1000000)::text, 6, '0'),
  'Payment received',
  'completed',
  NOW(),
  NOW()
FROM invoices i
WHERE i.paid_amount > 0;

-- ============================================================================
-- QR CODES
-- ============================================================================

INSERT INTO qr_codes (id, student_id, qr_data, valid_from, valid_until, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  p.id,
  'QR-STU-' || UPPER(SUBSTRING(MD5(p.id::text) FROM 1 FOR 12)),
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  true,
  NOW(),
  NOW()
FROM profiles p
WHERE p.role = 'student';

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Grade notifications
INSERT INTO notifications (id, user_id, type, title, message, target_id, read, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  g.student_id,
  'grade',
  'Grade Posted for ' || c.name,
  'Your current grade is ' || g.grade,
  g.id,
  RANDOM() < 0.4,
  NOW() - (RANDOM() * INTERVAL '7 days'),
  NOW()
FROM grades g
JOIN classes c ON g.class_id = c.id;

-- Assignment notifications
INSERT INTO notifications (id, user_id, type, title, message, target_id, read, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  e.student_id,
  'assignment',
  'New Assignment: ' || a.title,
  'Due date: ' || a.due_date::text,
  a.id,
  RANDOM() < 0.6,
  a.created_at,
  NOW()
FROM assignments a
JOIN enrollments e ON e.class_id = a.class_id
WHERE a.due_date > CURRENT_DATE
LIMIT 50; -- Limit to avoid too many

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  user_count int;
  class_count int;
  enrollment_count int;
  attendance_count int;
  assignment_count int;
  submission_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  SELECT COUNT(*) INTO class_count FROM classes;
  SELECT COUNT(*) INTO enrollment_count FROM enrollments;
  SELECT COUNT(*) INTO attendance_count FROM attendance;
  SELECT COUNT(*) INTO assignment_count FROM assignments;
  SELECT COUNT(*) INTO submission_count FROM submissions;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🎉 SEED DATA CREATED SUCCESSFULLY!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  👥 Users: % (admin/teacher/student)', user_count;
  RAISE NOTICE '  📚 Classes: %', class_count;
  RAISE NOTICE '  📝 Enrollments: %', enrollment_count;
  RAISE NOTICE '  ✅ Attendance Records: %', attendance_count;
  RAISE NOTICE '  📋 Assignments: %', assignment_count;
  RAISE NOTICE '  📤 Submissions: %', submission_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Test Accounts (create in Supabase Auth):';
  RAISE NOTICE '  🔐 Admin: admin@bhedu.example.com';
  RAISE NOTICE '  👨‍🏫 Teacher: john.doe@bhedu.example.com';
  RAISE NOTICE '  👩‍🎓 Student: alice.anderson@student.bhedu.example.com';
  RAISE NOTICE '================================================';
END $$;
