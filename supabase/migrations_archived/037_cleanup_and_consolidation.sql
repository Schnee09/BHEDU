-- Migration: 037_cleanup_and_consolidation.sql
-- Description: Clean up table structure, document purposes, deprecate unused tables
-- Date: 2025-11-18
-- Phase: Architecture Cleanup (Phase 1)

-- =============================================================================
-- TABLE DOCUMENTATION & CLEANUP
-- =============================================================================

-- ============================================================================
-- PRIMARY TABLES (ACTIVE - DO NOT MODIFY)
-- ============================================================================

COMMENT ON TABLE profiles IS 'Core user profiles for all roles (admin/teacher/student). Links to auth.users via FK.';
COMMENT ON TABLE classes IS 'PRIMARY table for class/course management. Use this for all class operations.';
COMMENT ON TABLE enrollments IS 'Student enrollment in classes. Links students to classes they attend.';
COMMENT ON TABLE attendance IS 'Daily attendance records. Links to classes and students.';
COMMENT ON TABLE assignments IS 'Teacher-created assignments for classes.';
COMMENT ON TABLE submissions IS 'Student submissions for assignments.';
COMMENT ON TABLE grades IS 'PRIMARY grading table. Final grades for students on assignments.';
COMMENT ON TABLE notifications IS 'User notifications (in-app messaging).';
COMMENT ON TABLE guardians IS 'Parent/guardian contact information linked to students.';

-- ============================================================================
-- GRADING & ACADEMIC SYSTEM
-- ============================================================================

COMMENT ON TABLE assignment_categories IS 'Grade categories (Homework, Quiz, Exam) with weights.';
COMMENT ON TABLE grading_scales IS 'Configurable grading scales (A-F, 0-100, etc.). Used by classes.';
COMMENT ON TABLE academic_years IS 'School year management (2024-2025, etc.). Controls active year.';
COMMENT ON TABLE scores IS 'DEPRECATED: Use grades table instead. Kept for backward compatibility.';

-- ============================================================================
-- FINANCIAL SYSTEM
-- ============================================================================

COMMENT ON TABLE fee_types IS 'Fee definitions (Tuition, Lab Fee, etc.).';
COMMENT ON TABLE payment_methods IS 'Payment options (Cash, Bank Transfer, Card).';
COMMENT ON TABLE payment_schedules IS 'Payment plans for students.';
COMMENT ON TABLE payment_schedule_installments IS 'Installment details for payment schedules.';
COMMENT ON TABLE fee_assignments IS 'Assign fees to students.';
COMMENT ON TABLE student_accounts IS 'Student balance tracking.';
COMMENT ON TABLE invoices IS 'Generated invoices for students.';
COMMENT ON TABLE invoice_items IS 'Line items on invoices.';
COMMENT ON TABLE payments IS 'Payment records.';
COMMENT ON TABLE payment_allocations IS 'Allocate payments to invoices.';

-- ============================================================================
-- SYSTEM & AUDIT
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'System audit trail for all critical operations.';
COMMENT ON TABLE user_activity_logs IS 'User activity tracking (logins, actions).';
COMMENT ON TABLE import_logs IS 'Bulk import operation tracking.';
COMMENT ON TABLE import_errors IS 'Errors from bulk import operations.';
COMMENT ON TABLE password_reset_requests IS 'Password reset request tracking.';
COMMENT ON TABLE school_settings IS 'Global system settings.';
COMMENT ON TABLE attendance_policies IS 'Attendance rules and policies.';

-- ============================================================================
-- ADVANCED FEATURES
-- ============================================================================

COMMENT ON TABLE qr_codes IS 'QR code-based attendance check-in.';
COMMENT ON TABLE attendance_reports IS 'Pre-generated attendance summary reports.';
COMMENT ON TABLE ai_feedback IS 'AI-generated feedback on submissions (future feature).';

-- ============================================================================
-- DEPRECATED TABLES
-- ============================================================================

COMMENT ON TABLE courses IS 'DEPRECATED: Use classes table instead. Kept for backward compatibility with old API routes.';
COMMENT ON TABLE lessons IS 'DEPRECATED: Related to old courses system. Not actively used.';

-- Mark as deprecated (optional - can drop in future migration)
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS lessons CASCADE;

-- ============================================================================
-- CLARIFICATIONS
-- ============================================================================

-- Q: Why both "classes" and "courses"?
-- A: Legacy. "courses" was from early development. "classes" is the primary table.
--    All new features should use "classes".

-- Q: Why both "scores" and "grades"?
-- A: "grades" is the current system (Migration 019). "scores" is legacy.
--    Use "grades" for all grading operations.

-- Q: Can we delete deprecated tables?
-- A: Not yet. Some old code may reference them. Plan to remove in Phase 4.

-- ============================================================================
-- RECOMMENDED NEXT STEPS
-- ============================================================================

-- 1. Audit all API routes to ensure they use "classes" not "courses"
-- 2. Migrate any data from "courses" to "classes" if needed
-- 3. Update all frontend code to use "classes" terminology
-- 4. In Phase 4: Drop "courses", "lessons", "scores" tables
-- 5. Create admin UI for academic_years, grading_scales, fee_types

-- =============================================================================
-- NO SCHEMA CHANGES IN THIS MIGRATION
-- This is documentation only. No ALTER/DROP statements to avoid breaking changes.
-- =============================================================================
