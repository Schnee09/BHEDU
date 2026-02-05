-- Migration: Add missing columns to subjects table
-- Created: 2026-01-26

ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
