-- Migration: Fix create_system_notification helper function
-- Created: 2026-07-14
-- Purpose: Insert target_user_id (profile ID) instead of auth_id (user_id) to match notifications_user_id_fkey constraint

CREATE OR REPLACE FUNCTION public.create_system_notification(
  target_user_id uuid,
  title text,
  message text,
  type text DEFAULT 'info',
  category text DEFAULT 'general',
  link text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- Insert target_user_id directly since notifications.user_id references profiles.id
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    INSERT INTO public.notifications (user_id, title, message, type, category, link)
    VALUES (target_user_id, title, message, type, category, link);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
