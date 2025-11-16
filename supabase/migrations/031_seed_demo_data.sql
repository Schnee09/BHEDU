-- 031_seed_demo_data.sql
-- WARNING: This migration truncates and reseeds many tables.
-- Intended for test environments only.

-- CLEANUP
TRUNCATE TABLE payment_allocations, payments, invoices, student_accounts CASCADE;
TRUNCATE TABLE qr_codes CASCADE;
TRUNCATE TABLE submissions, assignment_categories, assignments CASCADE;
TRUNCATE TABLE grades CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE guardians CASCADE;
TRUNCATE TABLE classes CASCADE;
TRUNCATE TABLE import_errors, import_logs CASCADE;
TRUNCATE TABLE user_activity_logs, audit_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE grading_scales, academic_years CASCADE;
TRUNCATE TABLE fee_types, payment_methods, payment_schedules, payment_schedule_installments, fee_assignments, invoice_items CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- NOTE: Do not modify school_settings here. Migration 021 defines key/value settings.

-- ACADEMIC YEARS
INSERT INTO academic_years (id, name, start_date, end_date, is_current, created_at, updated_at)
VALUES 
  (gen_random_uuid(), '2023-2024', '2023-09-01', '2024-06-30', false, NOW(), NOW()),
  (gen_random_uuid(), '2024-2025', '2024-09-01', '2025-06-30', true, NOW(), NOW()),
  (gen_random_uuid(), '2025-2026', '2025-09-01', '2026-06-30', false, NOW(), NOW());

-- Use JSONB-based grading scale per migration 021
INSERT INTO grading_scales (name, description, scale, is_default)
VALUES (
  'Standard US Letter Grade', 'Traditional A-F grading scale',
  '[
    {"letter": "A+", "min": 97, "max": 100, "gpa": 4.0, "description": "Outstanding"},
    {"letter": "A",  "min": 93, "max": 96,  "gpa": 4.0, "description": "Excellent"},
    {"letter": "A-", "min": 90, "max": 92,  "gpa": 3.7, "description": "Very Good"},
    {"letter": "B+", "min": 87, "max": 89,  "gpa": 3.3, "description": "Good"},
    {"letter": "B",  "min": 83, "max": 86,  "gpa": 3.0, "description": "Above Average"},
    {"letter": "B-", "min": 80, "max": 82,  "gpa": 2.7, "description": "Average"},
    {"letter": "C+", "min": 77, "max": 79,  "gpa": 2.3, "description": "Satisfactory"},
    {"letter": "C",  "min": 73, "max": 76,  "gpa": 2.0, "description": "Below Average"},
    {"letter": "C-", "min": 70, "max": 72,  "gpa": 1.7, "description": "Poor"},
    {"letter": "D",  "min": 60, "max": 69,  "gpa": 1.0, "description": "Failing"},
    {"letter": "F",  "min": 0,  "max": 59,  "gpa": 0.0, "description": "Fail"}
  ]'::jsonb,
  true
);

INSERT INTO profiles (id, full_name, role, avatar_url, phone, address, created_at)
SELECT 
  au.id,
  'System Administrator',
  'admin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  '+1-555-0101',
  '100 Admin Avenue',
  NOW()
FROM auth.users au WHERE au.email = 'admin@bhedu.example.com';

INSERT INTO profiles (id, full_name, role, avatar_url, phone, address, created_at)
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
  '+1-555-020' || (ROW_NUMBER() OVER()),
  '200 Teacher Lane #' || (ROW_NUMBER() OVER()),
  NOW()
FROM auth.users au
WHERE au.email IN ('john.doe@bhedu.example.com','emily.johnson@bhedu.example.com','michael.brown@bhedu.example.com','sarah.davis@bhedu.example.com');

INSERT INTO profiles (id, full_name, role, avatar_url, phone, address, date_of_birth, created_at)
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
  '+1-555-030' || (ROW_NUMBER() OVER()),
  '300 Student Street #' || (ROW_NUMBER() OVER()),
  DATE '2008-01-01' + (RANDOM() * 365 * 2)::int,
  NOW()
FROM auth.users au
WHERE au.email LIKE '%@student.bhedu.example.com';

INSERT INTO classes (id, name, grade, teacher_id, created_at)
SELECT 
  gen_random_uuid(), name, NULL,
  (SELECT au.id FROM auth.users au WHERE au.email = teacher_email LIMIT 1),
  NOW()
FROM (VALUES
  ('Mathematics 101','john.doe@bhedu.example.com'),
  ('English Literature','emily.johnson@bhedu.example.com'),
  ('Science Lab','michael.brown@bhedu.example.com'),
  ('History & Social Studies','sarah.davis@bhedu.example.com'),
  ('Advanced Mathematics','john.doe@bhedu.example.com')
) t(name,teacher_email);

-- ENROLLMENTS
WITH class_list AS (
  SELECT id as class_id, ROW_NUMBER() OVER() as class_num FROM classes
), student_list AS (
  SELECT id as student_id, ROW_NUMBER() OVER() as student_num FROM profiles WHERE role='student'
)
INSERT INTO enrollments (id, student_id, class_id, enrolled_at)
SELECT gen_random_uuid(), sl.student_id, cl.class_id, '2024-09-01'
FROM student_list sl CROSS JOIN class_list cl
WHERE (sl.student_num + cl.class_num) % 3 != 0
LIMIT 24;

-- ATTENDANCE (last 2 weeks, weekdays only)
INSERT INTO attendance (id, class_id, student_id, date, status, notes, marked_by, created_at)
SELECT gen_random_uuid(), e.class_id, e.student_id, d.date,
  CASE WHEN RANDOM()<0.85 THEN 'present' WHEN RANDOM()<0.95 THEN 'late' ELSE 'absent' END,
  CASE WHEN RANDOM()<0.1 THEN 'Medical excuse' ELSE NULL END,
  c.teacher_id, NOW()
FROM enrollments e
JOIN classes c ON e.class_id=c.id
CROSS JOIN (
  SELECT generate_series(CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE, INTERVAL '1 day')::date AS date
) d
 WHERE EXTRACT(DOW FROM d.date) BETWEEN 1 AND 5;

-- ASSIGNMENT CATEGORIES
INSERT INTO assignment_categories (id, class_id, name, weight, description, created_at, updated_at)
SELECT gen_random_uuid(), c.id, cat.name, cat.weight, cat.description, NOW(), NOW()
FROM classes c
CROSS JOIN (VALUES
  ('Homework',30,'Regular homework assignments'),
  ('Quizzes',20,'Short quizzes'),
  ('Exams',40,'Major exams'),
  ('Participation',10,'Class participation')
) cat(name,weight,description);

-- ASSIGNMENTS
INSERT INTO assignments (id, class_id, category_id, title, description, due_date, total_points, created_at, updated_at)
SELECT gen_random_uuid(), c.id, ac.id,
  CASE ac.name
    WHEN 'Homework' THEN c.name || ' - Chapter ' || (n+1) || ' Homework'
    WHEN 'Quizzes' THEN c.name || ' - Quiz ' || (n+1)
    WHEN 'Exams' THEN c.name || ' - ' || CASE WHEN n=0 THEN 'Midterm' ELSE 'Final' END || ' Exam'
    WHEN 'Participation' THEN c.name || ' - Participation Week ' || (n+1)
  END,
  'Complete the assigned work',
  CURRENT_DATE + (n * 7 - 14) * INTERVAL '1 day',
  CASE ac.name WHEN 'Homework' THEN 100 WHEN 'Quizzes' THEN 50 WHEN 'Exams' THEN 200 WHEN 'Participation' THEN 10 END,
  NOW(), NOW()
FROM classes c
JOIN assignment_categories ac ON ac.class_id=c.id
CROSS JOIN generate_series(0,2) AS n
WHERE (ac.name='Exams' AND n<2) OR (ac.name!='Exams' AND n<3);

-- SUBMISSIONS (optional) and per-assignment GRADES
WITH past AS (
  SELECT a.id, a.class_id FROM assignments a WHERE a.due_date < CURRENT_DATE
)
INSERT INTO submissions (id, assignment_id, student_id, submitted_at, file_url, feedback)
SELECT gen_random_uuid(), pa.id, e.student_id,
  (SELECT due_date FROM assignments WHERE id=pa.id) - INTERVAL '1 day',
  NULL, NULL
FROM past pa
JOIN enrollments e ON e.class_id=pa.class_id
WHERE RANDOM()<0.9;

INSERT INTO grades (id, assignment_id, student_id, points_earned, late, excused, missing, feedback, graded_at, graded_by, created_at, updated_at)
SELECT gen_random_uuid(), a.id, e.student_id,
  ROUND((RANDOM()*0.3 + 0.7) * COALESCE(a.total_points, 100))::decimal(10,2),
  (RANDOM() < 0.1),
  false,
  false,
  CASE WHEN RANDOM()<0.3 THEN 'Excellent work!' WHEN RANDOM()<0.6 THEN 'Good job!' ELSE 'Keep it up!' END,
  NOW(), c.teacher_id, NOW(), NOW()
FROM assignments a
JOIN classes c ON a.class_id=c.id
JOIN enrollments e ON e.class_id=a.class_id
WHERE a.due_date < CURRENT_DATE AND RANDOM() < 0.9;

-- Course-level summary grades removed to align with current schema (per-assignment grades exist above)

-- GUARDIANS
INSERT INTO guardians (id, student_id, name, relationship, phone, email, address, is_primary_contact, created_at, updated_at)
SELECT gen_random_uuid(), p.id,
  CASE WHEN RANDOM()<0.5 THEN SPLIT_PART(p.full_name,' ',2) || ' (Parent)' ELSE 'Guardian of ' || p.full_name END,
  CASE WHEN RANDOM()<0.4 THEN 'mother' WHEN RANDOM()<0.8 THEN 'father' ELSE 'guardian' END,
  '+1-555-' || LPAD(floor(RANDOM()*10000)::text,4,'0'),
  'parent.' || LOWER(REPLACE(p.full_name,' ','.')) || '@example.com',
  p.address, true, NOW(), NOW()
FROM profiles p WHERE p.role='student';

-- FINANCE
INSERT INTO fee_types (id, name, description, amount, category, is_mandatory, is_active, academic_year_id, created_at, updated_at) VALUES
  (gen_random_uuid(),'Tuition','Regular tuition fee',5000.00,'tuition',true,true,(SELECT id FROM academic_years WHERE is_current = true LIMIT 1),NOW(),NOW()),
  (gen_random_uuid(),'Lab Fee','Science laboratory materials',200.00,'lab',true,true,(SELECT id FROM academic_years WHERE is_current = true LIMIT 1),NOW(),NOW()),
  (gen_random_uuid(),'Technology Fee','Computer lab and software',150.00,'technology',false,true,(SELECT id FROM academic_years WHERE is_current = true LIMIT 1),NOW(),NOW()),
  (gen_random_uuid(),'Library Fee','Library resources',100.00,'library',false,true,(SELECT id FROM academic_years WHERE is_current = true LIMIT 1),NOW(),NOW()),
  (gen_random_uuid(),'Activity Fee','Student activities',75.00,'activities',false,true,(SELECT id FROM academic_years WHERE is_current = true LIMIT 1),NOW(),NOW());

-- payment_methods per migration 022 schema (type, requires_reference)
INSERT INTO payment_methods (id, name, type, is_active, requires_reference, description, created_at) VALUES
  (gen_random_uuid(),'Cash','cash',true,false,'Cash payment',NOW()),
  (gen_random_uuid(),'Credit Card','card',true,true,'Credit/Debit card',NOW()),
  (gen_random_uuid(),'Bank Transfer','bank_transfer',true,true,'Direct transfer',NOW()),
  (gen_random_uuid(),'Check','cheque',true,true,'Check payment',NOW());

INSERT INTO payment_schedules (id, name, description, academic_year_id, schedule_type, created_at, updated_at) VALUES
  (gen_random_uuid(),'Fall 2024 - Installments','Three installments plan', (SELECT id FROM academic_years WHERE is_current = true LIMIT 1), 'installment', NOW(), NOW());

INSERT INTO payment_schedule_installments (id, schedule_id, installment_number, due_date, percentage, description, created_at) VALUES
  (gen_random_uuid(), (SELECT id FROM payment_schedules LIMIT 1), 1, DATE '2024-09-15', 40.00, 'First installment', NOW()),
  (gen_random_uuid(), (SELECT id FROM payment_schedules LIMIT 1), 2, DATE '2024-10-15', 30.00, 'Second installment', NOW()),
  (gen_random_uuid(), (SELECT id FROM payment_schedules LIMIT 1), 3, DATE '2024-11-15', 30.00, 'Final installment', NOW());

INSERT INTO student_accounts (id, student_id, academic_year_id, total_fees, total_paid, last_payment_date, created_at, updated_at)
SELECT gen_random_uuid(), p.id, (SELECT id FROM academic_years WHERE is_current = true LIMIT 1),
  5525.00,
  CASE WHEN RANDOM()<0.7 THEN 5525.00 ELSE (RANDOM()*4000 + 1525)::decimal(10,2) END,
  CURRENT_DATE - (RANDOM()*60)::int,
  NOW(), NOW()
FROM profiles p WHERE p.role='student';

INSERT INTO invoices (id, invoice_number, student_id, student_account_id, academic_year_id, issue_date, due_date, total_amount, paid_amount, status, notes, created_at, updated_at)
SELECT gen_random_uuid(), 'INV-2024-' || LPAD((ROW_NUMBER() OVER())::text,4,'0'),
  sa.student_id, sa.id, sa.academic_year_id,
  CURRENT_DATE - 7, '2024-12-31', sa.total_fees, sa.total_paid,
  CASE WHEN (sa.total_fees - sa.total_paid) = 0 THEN 'paid' WHEN sa.total_paid>0 THEN 'partial' ELSE 'unpaid' END,
  'Fall 2024 Semester Fees', NOW(), NOW()
FROM student_accounts sa;

INSERT INTO payments (id, receipt_number, student_id, student_account_id, invoice_id, payment_method_id, amount, payment_date, transaction_reference, notes, created_at, updated_at)
SELECT gen_random_uuid(), 'PAY-' || LPAD((ROW_NUMBER() OVER())::text,6,'0'), i.student_id, i.student_account_id, i.id,
  (SELECT id FROM payment_methods ORDER BY RANDOM() LIMIT 1),
  i.paid_amount / (1 + floor(RANDOM()*2)),
  CURRENT_DATE - (RANDOM()*90)::int,
  'TX-' || LPAD(floor(RANDOM()*1000000)::text,6,'0'),
  'Payment received', NOW(), NOW()
FROM invoices i WHERE i.paid_amount > 0;

-- QR CODES
INSERT INTO qr_codes (id, student_id, code, class_id, valid_date, expires_at, created_at)
SELECT gen_random_uuid(), p.id, 'QR-STU-' || UPPER(SUBSTRING(MD5(p.id::text) FROM 1 FOR 12)),
  NULL,
  CURRENT_DATE, NOW() + INTERVAL '1 year', NOW()
FROM profiles p WHERE p.role='student';

INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), gr.student_id, 'Grade Posted', 'New grade posted for: ' || a.title, 
  (RANDOM()<0.4), NOW() - (RANDOM()* INTERVAL '7 days')
FROM grades gr 
JOIN assignments a ON a.id = gr.assignment_id;

INSERT INTO notifications (id, target_id, title, message, read, created_at)
SELECT gen_random_uuid(), e.student_id, 'New Assignment', 'New assignment: ' || a.title || ' (Due: ' || a.due_date::date || ')', 
  (RANDOM()<0.6), a.created_at
FROM assignments a 
JOIN enrollments e ON e.class_id=a.class_id 
WHERE a.due_date > CURRENT_DATE 
LIMIT 50;

-- SUMMARY
DO $$
DECLARE uc int; cc int; ec int; ac int; ascnt int; sbc int; grc int; invc int; payc int; notc int;
BEGIN
  SELECT COUNT(*) INTO uc FROM profiles;
  SELECT COUNT(*) INTO cc FROM classes;
  SELECT COUNT(*) INTO ec FROM enrollments;
  SELECT COUNT(*) INTO ac FROM attendance;
  SELECT COUNT(*) INTO ascnt FROM assignments;
  SELECT COUNT(*) INTO sbc FROM submissions;
  SELECT COUNT(*) INTO grc FROM grades;
  SELECT COUNT(*) INTO invc FROM invoices;
  SELECT COUNT(*) INTO payc FROM payments;
  SELECT COUNT(*) INTO notc FROM notifications;
  RAISE NOTICE 'SEED DONE -> Users: %, Classes: %, Enrollments: %, Attendance: %, Assignments: %, Submissions: %, Grades: %, Invoices: %, Payments: %, Notifications: %', uc, cc, ec, ac, ascnt, sbc, grc, invc, payc, notc;
END $$;
