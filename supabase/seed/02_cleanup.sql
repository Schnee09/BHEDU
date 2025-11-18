-- Cleanup Script: 02_cleanup.sql
-- Description: Remove all seed data (for testing purposes)
-- WARNING: This will delete ALL data including user-created data!
-- Only run in development/testing environments!

-- =============================================================================
-- SAFETY CHECK
-- =============================================================================

DO $$
BEGIN
  -- Uncomment the line below to enable cleanup (safety mechanism)
  -- RAISE EXCEPTION 'Safety check: Uncomment the RAISE EXCEPTION line in this script to proceed';
  
  RAISE NOTICE '⚠️  WARNING: About to delete ALL data!';
  RAISE NOTICE '⏸️  You have 5 seconds to cancel...';
  PERFORM pg_sleep(5);
END $$;

-- =============================================================================
-- DELETE IN CORRECT ORDER (respecting foreign keys)
-- =============================================================================

-- Transactional data (most dependent)
TRUNCATE TABLE payment_allocations CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE fee_assignments CASCADE;
TRUNCATE TABLE student_accounts CASCADE;
TRUNCATE TABLE payment_schedule_installments CASCADE;
TRUNCATE TABLE payment_schedules CASCADE;

-- Academic data
TRUNCATE TABLE grades CASCADE;
TRUNCATE TABLE submissions CASCADE;
TRUNCATE TABLE attendance CASCADE;
TRUNCATE TABLE assignment_categories CASCADE;
TRUNCATE TABLE assignments CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE guardians CASCADE;
TRUNCATE TABLE classes CASCADE;

-- User data
TRUNCATE TABLE user_activity_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE qr_codes CASCADE;
TRUNCATE TABLE import_errors CASCADE;
TRUNCATE TABLE import_logs CASCADE;
TRUNCATE TABLE profiles CASCADE;

-- Reference data (last)
-- Uncomment if you want to delete reference data too
-- TRUNCATE TABLE fee_types CASCADE;
-- TRUNCATE TABLE payment_methods CASCADE;
-- TRUNCATE TABLE grading_scales CASCADE;
-- TRUNCATE TABLE academic_years CASCADE;
-- TRUNCATE TABLE attendance_policies CASCADE;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Cleanup completed!';
  RAISE NOTICE 'ℹ️  Reference data (academic years, grading scales, fee types) was NOT deleted.';
  RAISE NOTICE 'ℹ️  To delete reference data too, uncomment the lines in this script.';
  RAISE NOTICE '⏭️  Next step: Re-run seed scripts to populate fresh data.';
END $$;
