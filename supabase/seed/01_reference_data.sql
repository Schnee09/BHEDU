-- Seed Script: 01_reference_data.sql
-- Description: Seed non-user reference data (academic years, grading scales, fee types, etc.)
-- Safe to run: YES (uses ON CONFLICT DO NOTHING)
-- Dependencies: Migrations 001-037 must be applied first

-- =============================================================================
-- ACADEMIC YEARS
-- =============================================================================

INSERT INTO academic_years (id, name, start_date, end_date, is_current, created_at, updated_at)
VALUES 
  ('a1000000-0000-0000-0000-000000000001'::uuid, '2023-2024', '2023-09-01', '2024-06-30', false, NOW(), NOW()),
  ('a2000000-0000-0000-0000-000000000002'::uuid, '2024-2025', '2024-09-01', '2025-06-30', true, NOW(), NOW()),
  ('a3000000-0000-0000-0000-000000000003'::uuid, '2025-2026', '2025-09-01', '2026-06-30', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_current = EXCLUDED.is_current,
  updated_at = NOW();

-- =============================================================================
-- GRADING SCALES
-- =============================================================================

INSERT INTO grading_scales (id, name, description, scale, is_default, created_at)
VALUES (
  '01000000-0000-0000-0000-000000000001'::uuid,
  'Standard Letter Grade', 
  'Traditional A-F grading scale',
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
  true,
  NOW()
),
(
  '02000000-0000-0000-0000-000000000002'::uuid,
  'Percentage (0-100)',
  'Simple percentage-based grading',
  '[
    {"letter": "100", "min": 100, "max": 100, "gpa": 4.0, "description": "Perfect"},
    {"letter": "90+", "min": 90, "max": 99, "gpa": 3.7, "description": "Excellent"},
    {"letter": "80+", "min": 80, "max": 89, "gpa": 3.0, "description": "Good"},
    {"letter": "70+", "min": 70, "max": 79, "gpa": 2.0, "description": "Satisfactory"},
    {"letter": "60+", "min": 60, "max": 69, "gpa": 1.0, "description": "Pass"},
    {"letter": "<60", "min": 0,  "max": 59, "gpa": 0.0, "description": "Fail"}
  ]'::jsonb,
  false,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  scale = EXCLUDED.scale,
  is_default = EXCLUDED.is_default;

-- =============================================================================
-- PAYMENT METHODS
-- =============================================================================

INSERT INTO payment_methods (id, name, type, description, is_active, created_at)
VALUES
  ('0d111111-1111-1111-1111-111111110001'::uuid, 'Cash', 'cash', 'Cash payment', true, NOW()),
  ('0d111111-1111-1111-1111-111111110002'::uuid, 'Check', 'cheque', 'Check payment', true, NOW()),
  ('0d111111-1111-1111-1111-111111110003'::uuid, 'Bank Transfer', 'bank_transfer', 'Direct bank transfer', true, NOW()),
  ('0d111111-1111-1111-1111-111111110004'::uuid, 'Credit/Debit Card', 'card', 'Credit/Debit card payment', true, NOW()),
  ('0d111111-1111-1111-1111-111111110005'::uuid, 'Online Payment', 'online', 'Online payment gateway', true, NOW()),
  ('0d111111-1111-1111-1111-111111110006'::uuid, 'Mobile Money', 'mobile_money', 'Mobile money transfer', true, NOW())
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- FEE TYPES
-- =============================================================================
-- Note: fee_types has UNIQUE(name, academic_year_id), but we're inserting with NULL academic_year_id
-- These are global fee types that can be used across all academic years

INSERT INTO fee_types (id, name, description, amount, is_active, academic_year_id, created_at, updated_at)
VALUES
  ('0e111111-1111-1111-1111-111111110001'::uuid, 'Tuition Fee', 'Regular tuition fees', 5000.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110002'::uuid, 'Registration Fee', 'One-time registration fee', 500.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110003'::uuid, 'Lab Fee', 'Science laboratory usage fee', 300.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110004'::uuid, 'Library Fee', 'Library access and borrowing fee', 200.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110005'::uuid, 'Activity Fee', 'Extracurricular activities fee', 150.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110006'::uuid, 'Technology Fee', 'Computer lab and equipment access', 250.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110007'::uuid, 'Sports Fee', 'Sports and athletics programs', 200.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110008'::uuid, 'Transport Fee', 'School bus transportation', 400.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110009'::uuid, 'Uniform Fee', 'School uniform purchase', 300.00, true, NULL, NOW(), NOW()),
  ('0e111111-1111-1111-1111-111111110010'::uuid, 'Exam Fee', 'Examination and assessment', 100.00, true, NULL, NOW(), NOW())
ON CONFLICT (name, academic_year_id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =============================================================================
-- ATTENDANCE POLICIES (Optional - Configure as needed)
-- =============================================================================

-- Uncomment and customize if you want to set attendance policies
-- INSERT INTO attendance_policies (id, name, description, settings, created_at)
-- VALUES (
--   '0f111111-1111-1111-1111-111111110001'::uuid,
--   'Default Attendance Policy',
--   'Standard attendance tracking rules',
--   '{"required_percentage": 75, "tardy_grace_minutes": 10}'::jsonb,
--   NOW()
-- )
-- ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Reference data seeded successfully!';
  RAISE NOTICE '📊 Seeded: 3 academic years, 2 grading scales, 6 payment methods, 10 fee types';
  RAISE NOTICE '⏭️  Next step: Create test users via scripts/create-admin-users.ts';
END $$;
