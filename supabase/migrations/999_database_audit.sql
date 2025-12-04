-- ================================================================
-- DATABASE AUDIT & FIX SCRIPT
-- ================================================================
-- This script audits and fixes the database to match UI requirements
-- Run this to ensure all columns and tables exist
-- ================================================================

-- 1. AUDIT: Check profiles table columns
-- ================================================================
DO $$ 
DECLARE
    column_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== PROFILES TABLE AUDIT ===';
    
    -- Check each required column
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'student_code') INTO column_exists;
    RAISE NOTICE 'student_code: %', CASE WHEN column_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'grade_level') INTO column_exists;
    RAISE NOTICE 'grade_level: %', CASE WHEN column_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') INTO column_exists;
    RAISE NOTICE 'gender: %', CASE WHEN column_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') INTO column_exists;
    RAISE NOTICE 'status: %', CASE WHEN column_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') INTO column_exists;
    RAISE NOTICE 'is_active: %', CASE WHEN column_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'photo_url') INTO column_exists;
    RAISE NOTICE 'photo_url: %', CASE WHEN column_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'enrollment_date') INTO column_exists;
    RAISE NOTICE 'enrollment_date: %', CASE WHEN column_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
END $$;

-- 2. FIX: Add missing columns to profiles table
-- ================================================================
DO $$ 
BEGIN
    RAISE NOTICE '=== ADDING MISSING COLUMNS ===';
    
    -- Add student_code if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'student_code') THEN
        ALTER TABLE profiles ADD COLUMN student_code VARCHAR(50) UNIQUE;
        RAISE NOTICE '✓ Added student_code column';
    END IF;
    
    -- Add grade_level if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'grade_level') THEN
        ALTER TABLE profiles ADD COLUMN grade_level VARCHAR(20);
        RAISE NOTICE '✓ Added grade_level column';
    END IF;
    
    -- Add gender if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE profiles ADD COLUMN gender VARCHAR(20);
        RAISE NOTICE '✓ Added gender column';
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status VARCHAR(20) DEFAULT 'active';
        RAISE NOTICE '✓ Added status column';
    END IF;
    
    -- Add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✓ Added is_active column';
    END IF;
    
    -- Add photo_url if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'photo_url') THEN
        ALTER TABLE profiles ADD COLUMN photo_url TEXT;
        RAISE NOTICE '✓ Added photo_url column';
    END IF;
    
    -- Add enrollment_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'enrollment_date') THEN
        ALTER TABLE profiles ADD COLUMN enrollment_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE '✓ Added enrollment_date column';
    END IF;
    
    -- Add notes if missing (for admin notes)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notes') THEN
        ALTER TABLE profiles ADD COLUMN notes TEXT;
        RAISE NOTICE '✓ Added notes column';
    END IF;
    
    -- Add department if missing (for teachers)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
        ALTER TABLE profiles ADD COLUMN department TEXT;
        RAISE NOTICE '✓ Added department column';
    END IF;
END $$;

-- 3. CREATE INDEXES for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_student_code ON profiles(student_code);
CREATE INDEX IF NOT EXISTS idx_profiles_grade_level ON profiles(grade_level);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment_date ON profiles(enrollment_date);

-- 4. AUDIT: Check statistics
-- ================================================================
DO $$ 
DECLARE
    total_students INTEGER;
    total_teachers INTEGER;
    total_admins INTEGER;
    total_classes INTEGER;
    total_enrollments INTEGER;
BEGIN
    RAISE NOTICE '=== DATABASE STATISTICS ===';
    
    SELECT COUNT(*) INTO total_students FROM profiles WHERE role = 'student';
    RAISE NOTICE 'Total Students: %', total_students;
    
    SELECT COUNT(*) INTO total_teachers FROM profiles WHERE role = 'teacher';
    RAISE NOTICE 'Total Teachers: %', total_teachers;
    
    SELECT COUNT(*) INTO total_admins FROM profiles WHERE role = 'admin';
    RAISE NOTICE 'Total Admins: %', total_admins;
    
    SELECT COUNT(*) INTO total_classes FROM classes;
    RAISE NOTICE 'Total Classes: %', total_classes;
    
    SELECT COUNT(*) INTO total_enrollments FROM enrollments;
    RAISE NOTICE 'Total Enrollments: %', total_enrollments;
END $$;

-- 5. SHOW sample data
-- ================================================================
DO $$ 
BEGIN
    RAISE NOTICE '=== AUDIT COMPLETE ===';
    RAISE NOTICE 'Check above for:';
    RAISE NOTICE '  - Missing columns (should all show ✓ EXISTS now)';
    RAISE NOTICE '  - Database statistics';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update API endpoints to include all fields';
    RAISE NOTICE '  2. Test student CRUD operations';
    RAISE NOTICE '  3. Add sample data if needed';
END $$;
