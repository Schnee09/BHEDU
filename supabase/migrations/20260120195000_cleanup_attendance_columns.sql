-- Migration: Cleanup Attendance Columns
-- Purpose: Remove unneeded columns and standardize on 'remarks'

DO $$
BEGIN
    -- 1. Rename 'notes' to 'remarks' if 'remarks' doesn't exist yet
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'notes'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'remarks'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN notes TO remarks;
        RAISE NOTICE 'Renamed column notes to remarks';
    END IF;

    -- 2. If both exist (unexpected but possible if partially migrated), copy data and drop notes
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'notes'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'remarks'
    ) THEN
        UPDATE public.attendance SET remarks = COALESCE(remarks, notes);
        ALTER TABLE public.attendance DROP COLUMN notes;
        RAISE NOTICE 'Merged notes into remarks and dropped notes';
    END IF;

    -- 3. Drop check-in/out columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'check_in_time'
    ) THEN
        ALTER TABLE public.attendance DROP COLUMN check_in_time;
        RAISE NOTICE 'Dropped column check_in_time';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'check_out_time'
    ) THEN
        ALTER TABLE public.attendance DROP COLUMN check_out_time;
        RAISE NOTICE 'Dropped column check_out_time';
    END IF;

    -- 4. Drop other legacy columns if they exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'checked_in_at'
    ) THEN
        ALTER TABLE public.attendance DROP COLUMN checked_in_at;
        RAISE NOTICE 'Dropped column checked_in_at';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.attendance DROP COLUMN updated_at;
        RAISE NOTICE 'Dropped column updated_at';
    END IF;

END $$;

-- Verify final state
SELECT 'Attendance cleanup migration completed' AS status;
