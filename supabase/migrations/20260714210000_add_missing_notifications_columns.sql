-- Migration: Add missing notifications columns
-- Created: 2026-07-14
-- Purpose: Add category and link columns back to notifications table to fix trigger crashes

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT DEFAULT NULL;
