-- Migration: FIX STUDENT ACTIVITY & NOTIFICATIONS RLS
-- Created: 2026-03-20
-- Target: Allow students to see their own activity and all users to delete their own notifications

-- 1. AUDIT LOGS: Allow users to view their own activity
-- Current policy "Admins can view all audit logs" only allows admins.
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. NOTIFICATIONS: Allow users to delete their own notifications
-- Current policies "Users can view own notifications" and "Users can update own notifications" don't cover DELETE.
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 3. ENSURE PERMISSIONS
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT DELETE ON public.notifications TO authenticated;

-- 4. VERIFY (Commentary)
-- Users can now:
-- - View their own audit logs (enabling Activity Feed for students)
-- - Delete their own notifications (enabling the "Delete" button in UI)
