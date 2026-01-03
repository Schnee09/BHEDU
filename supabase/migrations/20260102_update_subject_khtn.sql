-- Clean up subjects and add "Môn khác"
-- Run this in Supabase SQL Editor

-- Add "Môn khác" if it doesn't exist
INSERT INTO subjects (name, code, description) 
VALUES ('Môn khác', 'OTHER', 'Các môn học khác')
ON CONFLICT (code) DO NOTHING;

-- Verify subjects
SELECT * FROM subjects ORDER BY name;
