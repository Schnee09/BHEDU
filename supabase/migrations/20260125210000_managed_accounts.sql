-- Add is_managed column to profiles
-- This identifies accounts that don't use real emails for password recovery

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_managed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_managed boolean DEFAULT false;
    
    -- Auto-mark existing student accounts with generated emails as managed
    UPDATE public.profiles 
    SET is_managed = true 
    WHERE email LIKE '%@student.bhedu.vn' OR email LIKE '%@parent.bhedu.vn';
  END IF;
END $$;
